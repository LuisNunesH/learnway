#!/usr/bin/env python3
r"""
Cria a VM do LearnWay na Oracle Cloud, insistindo até a capacidade abrir.

POR QUE ISTO EXISTE
    A cota Always Free dá uma VM ARM (Ampere A1) de graça e para sempre, mas a
    capacidade dessas máquinas esgota nas regiões populares. Tentar pelo console
    devolve "Out of capacity for shape VM.Standard.A1.Flex" — não é erro de
    configuração, é fila. A capacidade volta em janelas curtas e imprevisíveis,
    quase sempre de madrugada. Este script fica tentando por você.

COMO USAR
    deploy\criar-vm-oracle.cmd

    Ou, direto: C:\ocicli\Scripts\python.exe deploy\criar-vm-oracle.py

    Precisa ser o Python de C:\ocicli — é lá que a biblioteca da Oracle foi
    instalada. Ela não cabe no Python da Microsoft Store: os nomes de arquivo do
    SDK estouram o limite de 260 caracteres do Windows quando somados àquele
    caminho longo de LocalCache. Por isso o ambiente isolado numa pasta curta.

    Deixe rodando. Ele imprime uma linha por tentativa e para sozinho quando
    conseguir, mostrando o IP público. Ctrl+C interrompe a qualquer momento.

PRÉ-REQUISITOS
    1. `C:\ocicli\Scripts\oci.exe setup config` executado (cria ~/.oci/config).
    2. A chave pública de API cadastrada no console da Oracle.
    3. Uma chave SSH em ~/.ssh/learnway_oracle.pub — é ela que vai autorizar
       seu login na VM depois.

    Atenção: são DUAS chaves diferentes e é fácil confundir.
      - a chave de API   → o script usa para falar com a Oracle
      - a chave SSH      → você usa para entrar na VM

DEPOIS QUE FUNCIONAR
    Este arquivo não serve para mais nada; pode apagar.
"""

from __future__ import annotations

import argparse
import os
import random
import sys
import time
from datetime import datetime

try:
    import oci
except ImportError:
    sys.exit(
        "Rode este script com o Python do ambiente isolado, que é onde a\n"
        "biblioteca da Oracle está:\n\n"
        "    C:\\ocicli\\Scripts\\python.exe deploy\\criar-vm-oracle.py\n\n"
        "Se a pasta C:\\ocicli não existir, recrie com:\n"
        "    python -m venv C:\\ocicli\n"
        "    C:\\ocicli\\Scripts\\python.exe -m pip install oci-cli"
    )

# ─── O que criar ─────────────────────────────────────────────────────────────
# A subnet pública já criada no console. Não é segredo: é um identificador,
# inútil sem as credenciais.
SUBNET_ID = (
    "ocid1.subnet.oc1.sa-saopaulo-1."
    "aaaaaaaaw5733m4pcmqlwj7gfohg5pjdfobkr44demspyieowmbszm5nvcza"
)
DISPLAY_NAME = "instance-learnway"
SSH_PUBLIC_KEY = os.path.expanduser("~/.ssh/learnway_oracle.pub")

# Os dois shapes que a cota Always Free cobre.
#   A1.Flex  — ARM, até 4 OCPU / 24 GB. Melhor máquina, mas a capacidade vive
#              esgotada nas regiões populares (em São Paulo, 119 tentativas
#              seguidas sem vaga).
#   E2.1.Micro — AMD/x86, 1 OCPU / 1 GB FIXOS. Fraca, e por isso quase sempre
#              tem vaga. Não é "Flex": mandar shape_config nela dá erro.
SHAPE_ARM = "VM.Standard.A1.Flex"
SHAPE_AMD = "VM.Standard.E2.1.Micro"

# Erros da Oracle que significam "tente de novo", não "você errou".
RETRYABLE = ("outofcapacity", "out of capacity", "out of host capacity")


def log(msg: str) -> None:
    print(f"[{datetime.now():%H:%M:%S}] {msg}", flush=True)


def load_ssh_key(path: str) -> str:
    if not os.path.exists(path):
        sys.exit(
            f"Não achei a chave SSH pública em {path}.\n"
            'Crie com:  ssh-keygen -t ed25519 -f ~/.ssh/learnway_oracle -N ""'
        )
    key = open(path, encoding="utf-8").read().strip()
    if not key.startswith(("ssh-", "ecdsa-")):
        sys.exit(f"{path} não parece uma chave pública SSH.")
    return key


def find_ubuntu_image(compute, compartment: str, shape: str) -> tuple[str, str]:
    """
    A imagem Ubuntu 22.04 mais recente compatível com o shape.

    Filtrar por `shape` resolve a arquitetura sozinho: para o A1 a Oracle
    devolve a aarch64, para o E2.1.Micro devolve a x86_64. Não dá para
    reaproveitar a imagem de um no outro.
    """
    images = compute.list_images(
        compartment_id=compartment,
        operating_system="Canonical Ubuntu",
        operating_system_version="22.04",
        shape=shape,
        sort_by="TIMECREATED",
        sort_order="DESC",
        limit=1,
    ).data
    if not images:
        sys.exit(f"Nenhuma imagem Ubuntu 22.04 disponível para o shape {shape}.")
    return images[0].id, images[0].display_name


def build_details(compartment, ad_name, image_id, ssh_key, shape, ocpus, memory):
    details = oci.core.models.LaunchInstanceDetails(
        compartment_id=compartment,
        availability_domain=ad_name,
        display_name=DISPLAY_NAME,
        shape=shape,
        source_details=oci.core.models.InstanceSourceViaImageDetails(image_id=image_id),
        create_vnic_details=oci.core.models.CreateVnicDetails(
            subnet_id=SUBNET_ID,
            assign_public_ip=True,
        ),
        # É por aqui que a chave SSH entra na VM: o cloud-init do Ubuntu lê este
        # campo e escreve em ~ubuntu/.ssh/authorized_keys no primeiro boot.
        metadata={"ssh_authorized_keys": ssh_key},
    )
    # Só shape "Flex" aceita tamanho sob medida. O E2.1.Micro tem 1 OCPU / 1 GB
    # cravados, e mandar shape_config nele faz a API recusar o pedido.
    if "Flex" in shape:
        details.shape_config = oci.core.models.LaunchInstanceShapeConfigDetails(
            ocpus=ocpus, memory_in_gbs=memory
        )
    return details


def public_ip_of(compute, network, compartment: str, instance_id: str) -> str | None:
    attachments = compute.list_vnic_attachments(
        compartment_id=compartment, instance_id=instance_id
    ).data
    for att in attachments:
        if att.vnic_id:
            vnic = network.get_vnic(att.vnic_id).data
            if vnic.public_ip:
                return vnic.public_ip
    return None


def wait_until_running(compute, network, compartment: str, instance_id: str) -> None:
    log("Instância aceita. Esperando ficar RUNNING…")
    for _ in range(60):
        state = compute.get_instance(instance_id).data.lifecycle_state
        if state == "RUNNING":
            ip = public_ip_of(compute, network, compartment, instance_id)
            print()
            log("PRONTO — a VM está no ar.")
            print()
            print(f"    IP público : {ip}")
            print(f"    Instância  : {instance_id}")
            print()
            print("    Entre com:")
            print(f"        ssh -i ~/.ssh/learnway_oracle ubuntu@{ip}")
            print()
            print("    Anote esse IP: ele vai para o DuckDNS (passo 3.1) e para o")
            print("    segredo VM_HOST do GitHub (passo 5.2).")
            return
        time.sleep(10)
    log("A instância foi criada, mas demorou para ficar RUNNING. Veja no console.")


def main() -> None:
    ap = argparse.ArgumentParser(description="Cria a VM do LearnWay insistindo até conseguir.")
    ap.add_argument(
        "--amd",
        action="store_true",
        help=f"usa {SHAPE_AMD} (x86, 1 GB) em vez do ARM. Menos potente, mas quase sempre tem vaga.",
    )
    ap.add_argument("--ocpus", type=int, default=1, help="núcleos, só no ARM (padrão: 1)")
    ap.add_argument("--memory", type=int, default=6, help="GB de RAM, só no ARM (padrão: 6)")
    ap.add_argument(
        "--intervalo",
        type=int,
        default=120,
        help="segundos entre rodadas (padrão: 120). Abaixo de 60 a Oracle começa a limitar.",
    )
    args = ap.parse_args()

    ssh_key = load_ssh_key(SSH_PUBLIC_KEY)

    try:
        config = oci.config.from_file()
        oci.config.validate_config(config)
    except Exception as exc:
        sys.exit(
            f"Configuração da Oracle inválida ou ausente:\n  {exc}\n\n"
            "Rode isto e responda as perguntas (passphrase VAZIA):\n"
            r"    C:\ocicli\Scripts\oci.exe setup config"
        )

    compartment = config["tenancy"]
    identity = oci.identity.IdentityClient(config)
    compute = oci.core.ComputeClient(config)
    network = oci.core.VirtualNetworkClient(config)

    shape = SHAPE_AMD if args.amd else SHAPE_ARM
    tamanho = "1 OCPU / 1 GB (fixo)" if args.amd else f"{args.ocpus} OCPU / {args.memory} GB"

    ads = identity.list_availability_domains(compartment_id=compartment).data
    image_id, image_name = find_ubuntu_image(compute, compartment, shape)

    print()
    log(f"Região        : {config['region']}")
    log(f"Shape         : {shape} — {tamanho}")
    log(f"Imagem        : {image_name}")
    log(f"Domínios      : {', '.join(a.name.split(':')[-1] for a in ads)}")
    log(f"Intervalo     : {args.intervalo}s")
    print()
    log("Tentando até conseguir. Pode deixar rodando a noite toda — Ctrl+C para parar.")
    print()

    attempt = 0
    while True:
        for ad in ads:
            attempt += 1
            short_ad = ad.name.split(":")[-1]
            details = build_details(
                compartment, ad.name, image_id, ssh_key, shape, args.ocpus, args.memory
            )
            try:
                resp = compute.launch_instance(details)
                wait_until_running(compute, network, compartment, resp.data.id)
                return
            except oci.exceptions.ServiceError as exc:
                blob = f"{exc.code} {exc.message}".lower()

                if any(token in blob for token in RETRYABLE):
                    log(f"#{attempt} {short_ad}: sem capacidade")
                    continue

                if exc.status == 429:
                    # A Oracle está pedindo calma. Respeitar é o que mantém a
                    # conta fora de bloqueio temporário.
                    log(f"#{attempt} {short_ad}: limite de chamadas — esperando 5 min")
                    time.sleep(300)
                    continue

                if "limitexceeded" in blob or "quota" in blob:
                    print()
                    sys.exit(
                        f"Cota estourada, e insistir não resolve:\n  {exc.message}\n\n"
                        "Provavelmente já existe outra instância consumindo a cota "
                        "Always Free. Apague-a no console ou reduza --ocpus/--memory."
                    )

                print()
                sys.exit(f"Erro que não é de capacidade (status {exc.status}):\n  {exc.message}")

        # Um pouco de aleatoriedade evita cair sempre no mesmo instante que
        # outras milhares de pessoas rodando scripts parecidos.
        time.sleep(args.intervalo + random.randint(0, 20))


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print()
        log("Interrompido. Nada foi criado nesta rodada; rode de novo quando quiser.")
