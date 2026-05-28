export const MSG = {
  // Browser compatibility
  CHECKING_BROWSER: 'Checking browser compatibility ...',
  UNSUPPORTED_TITLE: 'Browser Not Supported',
  UNSUPPORTED_WEBUSB: 'Your browser does not support WebUSB, which is required to flash firmware to your Hothouse.',
  UNSUPPORTED_INSECURE: 'WebUSB requires a secure (HTTPS) connection. Please access this page over HTTPS.',
  SUPPORTED_BROWSERS: 'Please use Google Chrome, Microsoft Edge, or another Chromium-based desktop browser.',

  // Idle / intro
  IDLE_HEADING: 'Flash DSP Examples to Your Hothouse Pedal',
  IDLE_INTRO_BEFORE: 'Use this tool to install open source examples from the official ',
  IDLE_INTRO_LINK: 'HothouseExamples GitHub repo',
  IDLE_INTRO_AFTER: ' onto your Hothouse pedal over USB.',
  REPO_URL: 'https://github.com/clevelandmusicco/HothouseExamples',

  // Manifest
  LOADING_MANIFEST: 'Loading available examples',
  MANIFEST_ERROR_TITLE: 'Could Not Load Firmware List',
  MANIFEST_ERROR_RETRY: 'Retry',

  // Device connection
  CONNECT_BUTTON: 'Connect Hothouse',
  CONNECTING: 'Waiting for device ...',
  CONNECT_CANCELLED: 'Connection cancelled.',
  CONNECT_CANCELLED_DETAIL: 'No device was selected. Click "Connect Hothouse" to try again.',
  CONNECT_ERROR_TITLE: 'Connection Failed',
  CONNECT_ERROR_NO_DEVICE: 'No compatible DFU device was found. Make sure your Hothouse is in DFU mode.',
  DISCONNECT_BUTTON: 'Disconnect',

  // DFU mode instructions
  DFU_MODE_HEADING: 'Put Your Hothouse Into DFU Mode',

  DFU_QUICK_LABEL: 'Quick method',
  DFU_QUICK_INTRO: 'If your Hothouse is currently running any official HothouseExamples firmware:',
  DFU_QUICK_NOTE: 'NOTE: This excludes Earth, Mars & Venus binaries for now.\n ' +
                  'You will need to use the standard method after you flash one of those.',
  DFU_QUICK_STEPS: [
    'Connect it to your computer with a USB cable.',
    'Simultaneously hold BOTH footswitches down for 2 seconds.',
    'Release when the LEDs alternately flash. Your Hothouse is now in DFU mode.',    
  ],

  DFU_STANDARD_LABEL: 'Standard method',
  DFU_STANDARD_INTRO: 'If the quick method doesn\'t work (non-HothouseExamples firmware previously loaded, new Daisy Seed, etc.):',
  DFU_STANDARD_STEPS: [
    'Remove the Hothouse back plate and connect to your computer with a USB cable.',
    'Hold the BOOT button on the Daisy Seed.',
    'While holding BOOT, press and release the RESET button.',
    'Release BOOT. Your Hothouse is now in DFU mode.',    
  ],

  // Firmware selection
  FIRMWARE_LIST_HEADING: 'Choose Example',
  RELEASE_LABEL: 'Firmware release',
  FLASH_BUTTON: 'Flash Example',
  CHANGE_FIRMWARE: 'Change',
  SELECTED_LABEL: 'Selected:',

  // Flashing
  ERASING_HEADING: 'Erasing ...',
  FLASHING_HEADING: 'Flashing ...',
  FLASHING_DETAIL: (name: string) => `Flashing ${name}. This might take a moment ...`,
  FLASHING_DO_NOT_DISCONNECT: 'Do not disconnect your Hothouse during flashing.',

  // Success
  SUCCESS_HEADING: 'Example Flashed Successfully!',
  SUCCESS_DETAIL: (name: string) => `${name} has been installed successfully.`,
  SUCCESS_RESET_INSTRUCTION: 'You can start using the new example right away. Just make sure the Hothouse has a 9V center-negative power supply connected.',
  FLASH_ANOTHER: 'Flash Another Example',
  SOURCE_URL: 'View the source code and README on GitHub →',

  // Errors
  FLASH_ERROR_TITLE: 'Flash Failed',
  FLASH_ERROR_DETAIL: 'Something went wrong while flashing. Please try again.',
  TRY_AGAIN: 'Try Again',

  // Windows troubleshooting
  WINDOWS_HEADING: 'Windows Users: Driver Setup Required',
  WINDOWS_INTRO:
    'On Windows, the browser may not be able to see your Hothouse in DFU mode until you install the correct USB driver using a free tool called Zadig.',
  WINDOWS_STEPS: [
    'Put your Hothouse into DFU mode (see instructions above).',
    'Connect it to your computer via USB.',
    'Download and open Zadig from zadig.akeo.ie.',
    'In Zadig, find the DFU device — it is usually listed as "DFU in FS Mode" or "STM32 BOOTLOADER".',
    'Select "WinUSB" as the driver.',
    'Click "Install Driver" or "Replace Driver".',
    'Return to this page and click "Connect Hothouse" again.',
  ],
  WINDOWS_NOTE:
    'You only need to do this once. After installing the WinUSB driver, the browser will recognize your Hothouse in DFU mode automatically.',
  ZADIG_URL: 'https://zadig.akeo.ie/',

  // Device disconnected unexpectedly
  DEVICE_DISCONNECTED: 'Your Hothouse was disconnected. Please reconnect it and try again.',
} as const;
