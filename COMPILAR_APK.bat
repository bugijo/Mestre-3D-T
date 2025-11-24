@echo off
REM Script para compilar o APK do Mestre 3D&T

echo ============================================
echo   Compilador APK - Mestre 3D^&T
echo ============================================
echo.

echo Verificando Android Studio...
if exist "C:\Program Files\Android\Android Studio\jbr\bin\java.exe" (
    set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
    echo Android Studio encontrado!
) else (
    echo ERRO: Android Studio nao encontrado.
    echo.
    echo Por favor, instale o Android Studio de:
    echo https://developer.android.com/studio
    echo.
    pause
    exit /b 1
)

echo.
echo Verificando SDK do Android...
if exist "%LOCALAPPDATA%\Android\Sdk" (
    set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
    echo Android SDK encontrado!
) else (
    echo ERRO: Android SDK nao encontrado.
    echo Configure o SDK atraves do Android Studio.
    pause
    exit /b 1
)

echo.
echo ============================================
echo   INSTRUCOES PARA COMPILAR O APK
echo ============================================
echo.
echo Como o wrapper do Gradle nao esta presente, siga estes passos:
echo.
echo 1. Abra o Android Studio
echo 2. Clique em "Open" e selecione esta pasta:
echo    %~dp0
echo.
echo 3. Aguarde o projeto sincronizar
echo.
echo 4. No menu superior, va em:
echo    Build ^> Build Bundle(s) / APK(s) ^> Build APK(s)
echo.
echo 5. Aguarde a compilacao terminar
echo.
echo 6. O APK estara em:
echo    %~dp0app\build\outputs\apk\debug\app-debug.apk
echo.
echo 7. Transfira o APK para seu celular e instale
echo    (Pode ser necessario ativar "Fontes Desconhecidas")
echo.
echo ============================================
echo.

echo Deseja abrir o Android Studio agora? (S/N)
choice /c SN /n /m "Escolha: "
if errorlevel 2 goto :end
if errorlevel 1 goto :open_studio

:open_studio
echo.
echo Procurando Android Studio...

if exist "C:\Program Files\Android\Android Studio\bin\studio64.exe" (
    echo Abrindo projeto no Android Studio...
    start "" "C:\Program Files\Android\Android Studio\bin\studio64.exe" "%~dp0"
    goto :end
)

if exist "%LOCALAPPDATA%\Programs\Android Studio\bin\studio64.exe" (
    echo Abrindo projeto no Android Studio...
    start "" "%LOCALAPPDATA%\Programs\Android Studio\bin\studio64.exe" "%~dp0"
    goto :end
)

echo Android Studio nao encontrado nos locais padrao.
echo Abra manualmente e carregue este projeto:
echo %~dp0

:end
echo.
pause
