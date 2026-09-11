@echo off
REM Atalho para o script que insiste na criacao da VM ARM da Oracle.
REM
REM Existe para voce nao ter que lembrar do caminho do Python isolado.
REM O SDK da Oracle mora em C:\ocicli porque os nomes de arquivo dele
REM estouram o limite de 260 caracteres do Windows se instalados no
REM Python da Microsoft Store.
REM
REM Deixe esta janela aberta. Ela para sozinha quando a VM subir.

if not exist "C:\ocicli\Scripts\python.exe" (
    echo.
    echo O ambiente C:\ocicli nao existe. Crie com:
    echo     python -m venv C:\ocicli
    echo     C:\ocicli\Scripts\python.exe -m pip install oci-cli
    echo.
    pause
    exit /b 1
)

"C:\ocicli\Scripts\python.exe" "%~dp0criar-vm-oracle.py" %*

echo.
echo Script encerrado. Feche a janela quando quiser.
pause
