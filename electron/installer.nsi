; Supported custom-script adapter for unsigned Linux cross builds.
; The uninstaller is extracted from this build's stock NSIS intermediate using
; electron-builder's UninstallerReader, rather than executing it under Wine.
!ifdef UNINSTALLER_OUT_FILE
  !undef UNINSTALLER_OUT_FILE
!endif
!define UNINSTALLER_OUT_FILE "${PROJECT_DIR}/release/unsigned-uninstaller.exe"
!include "${PROJECT_DIR}/node_modules/app-builder-lib/templates/nsis/installer.nsi"
