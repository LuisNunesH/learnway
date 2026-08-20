package com.learnway;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.io.File;

/**
 * LearnWay API — gamified learning platform for Java fullstack developers.
 */
@SpringBootApplication
@EnableScheduling
public class LearnwayApplication {

    public static void main(String[] args) {
        loadDotEnv();
        SpringApplication.run(LearnwayApplication.class, args);
    }

    /**
     * Carrega o arquivo .env (se existir) ANTES de subir o contexto Spring, para que
     * placeholders como ${DATABASE_URL} em application.yml já estejam resolvidos quando
     * o DataSource / Flyway forem criados. Variáveis já presentes no ambiente do sistema
     * (CI/produção) têm prioridade e não são sobrescritas.
     *
     * Procura o .env em dois pontos de partida, subindo a árvore de diretórios em cada um:
     *   1. o working directory (cobre `mvn spring-boot:run` rodado de dentro do módulo);
     *   2. o local do código compilado / jar (cobre o botão Run do IDE, cujo working dir
     *      é a raiz do workspace — ex.: .../learnway — e não a pasta do módulo
     *      .../learnway/learnway-api, onde o .env de fato está).
     */
    private static void loadDotEnv() {
        File envFile = findEnvFrom(new File(System.getProperty("user.dir")));
        if (envFile == null) {
            envFile = findEnvFrom(codeSourceDir());
        }

        if (envFile == null) {
            System.out.println("[dotenv] Nenhum arquivo .env encontrado "
                    + "(working dir: " + System.getProperty("user.dir")
                    + "). Usando apenas variáveis de ambiente do sistema.");
            return;
        }

        System.out.println("[dotenv] Carregando variáveis de " + envFile.getAbsolutePath());
        Dotenv dotenv = Dotenv.configure()
                .directory(envFile.getParent())
                .ignoreIfMissing()
                .load();
        dotenv.entries().forEach(entry -> {
            if (System.getenv(entry.getKey()) == null
                    && System.getProperty(entry.getKey()) == null) {
                System.setProperty(entry.getKey(), entry.getValue());
            }
        });
    }

    /** Sobe a árvore a partir de {@code start} procurando um arquivo .env. */
    private static File findEnvFrom(File start) {
        for (File d = start; d != null; d = d.getParentFile()) {
            File candidate = new File(d, ".env");
            if (candidate.isFile()) {
                return candidate;
            }
        }
        return null;
    }

    /** Diretório de onde a aplicação foi carregada (target/classes ou pasta do jar). */
    private static File codeSourceDir() {
        try {
            File code = new File(LearnwayApplication.class.getProtectionDomain()
                    .getCodeSource().getLocation().toURI());
            return code.isDirectory() ? code : code.getParentFile();
        } catch (Exception e) {
            return null;
        }
    }
}
