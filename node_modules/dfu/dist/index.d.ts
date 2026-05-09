/// <reference types="w3c-web-usb" />
import { Emitter } from "nanoevents";
type DFUseMemorySegment = {
    start: number;
    end: number;
    sectorSize: number;
    readable: boolean;
    erasable: boolean;
    writable: boolean;
};
declare enum DFUseCommands {
    GET_COMMANDS = 0,
    SET_ADDRESS = 33,
    ERASE_SECTOR = 65
}
type WebDFUSettings = {
    name?: string;
    configuration: USBConfiguration;
    interface: USBInterface;
    alternate: USBAlternateInterface;
};
type WebDFUDeviceDescriptor = {
    bLength: number;
    bDescriptorType: number;
    bcdUSB: number;
    bDeviceClass: number;
    bDeviceSubClass: number;
    bDeviceProtocol: number;
    bMaxPacketSize: number;
    idVendor: number;
    idProduct: number;
    bcdDevice: number;
    iManufacturer: number;
    iProduct: number;
    iSerialNumber: number;
    bNumConfigurations: number;
};
type WebDFUFunctionalDescriptor = {
    bLength: number;
    bDescriptorType: number;
    bmAttributes: number;
    wDetachTimeOut: number;
    wTransferSize: number;
    bcdDFUVersion: number;
};
type WebDFUInterfaceDescriptor = {
    bLength: number;
    bDescriptorType: number;
    bInterfaceNumber: number;
    bAlternateSetting: number;
    bNumEndpoints: number;
    bInterfaceClass: number;
    bInterfaceSubClass: number;
    bInterfaceProtocol: number;
    iInterface: number;
    descriptors: (WebDFUFunctionalDescriptor | WebDFUInterfaceSubDescriptor)[];
};
type WebDFUInterfaceSubDescriptor = {
    descData: DataView;
    bLength: number;
    bDescriptorType: number;
    bmAttributes: number;
    wDetachTimeOut: number;
    wTransferSize: number;
    bcdDFUVersion: number;
};
type WebDFUEvent = {
    init: () => void;
    connect: () => void;
    disconnect: (error?: Error) => void;
};
type WebDFUOptions = {
    forceInterfacesName?: boolean;
};
type WebDFUProperties = {
    WillDetach: boolean;
    ManifestationTolerant: boolean;
    CanUpload: boolean;
    CanDownload: boolean;
    TransferSize: number;
    DetachTimeOut: number;
    DFUVersion: number;
};
type WebDFULog = Record<"info" | "warning", (msg: string) => void> & {
    progress: (done: number, total?: number) => void;
};
declare const WebDFUType: Record<"DFU" | "SDFUse", number>;
declare class WebDFUError extends Error {
}
// Parse descriptors
declare function parseMemoryDescriptor(desc: string): {
    name: string;
    segments: DFUseMemorySegment[];
};
declare function parseDeviceDescriptor(data: DataView): WebDFUDeviceDescriptor;
declare function parseFunctionalDescriptor(data: DataView): WebDFUFunctionalDescriptor;
declare function parseInterfaceDescriptor(data: DataView): WebDFUInterfaceDescriptor;
declare function parseSubDescriptors(descriptorData: DataView): (WebDFUFunctionalDescriptor | WebDFUInterfaceDescriptor)[];
declare function parseConfigurationDescriptor(data: DataView): {
    bLength: number;
    bDescriptorType: number;
    wTotalLength: number;
    bNumInterfaces: number;
    bConfigurationValue: number;
    iConfiguration: number;
    bmAttributes: number;
    bMaxPower: number;
    descriptors: (WebDFUFunctionalDescriptor | WebDFUInterfaceDescriptor)[];
};
type WebDFUProcessReadEvents = {
    process: (done: number, total?: number) => void;
    error: (error: any) => void;
    end: (data: Blob) => void;
};
type WebDFUProcessWriteEvents = {
    "erase/start": () => void;
    "erase/process": WebDFUProcessEraseEvents["process"];
    "erase/end": WebDFUProcessEraseEvents["end"];
    "write/start": () => void;
    "write/process": (bytesSent: number, expectedSize: number) => void;
    "write/end": (bytesSent: number) => void;
    verify: (status: {
        status: number;
        pollTimeout: number;
        state: number;
    }) => void;
    error: (error: any) => void;
    end: () => void;
};
type WebDFUProcessEraseEvents = {
    process: (bytesSent: number, expectedSize: number) => void;
    error: (error: any) => void;
    end: () => void;
};
interface WebDFUProcess<T> {
    events: Emitter<T>;
}
declare class WebDFUProcessRead implements WebDFUProcess<WebDFUProcessReadEvents> {
    events: Emitter<WebDFUProcessReadEvents>;
}
declare class WebDFUProcessWrite implements WebDFUProcess<WebDFUProcessWriteEvents> {
    events: Emitter<WebDFUProcessWriteEvents>;
}
declare const dfuCommands: {
    DETACH: number;
    DOWNLOAD: number;
    UPLOAD: number;
    GETSTATUS: number;
    CLRSTATUS: number;
    GETSTATE: number;
    ABORT: number;
    appIDLE: number;
    appDETACH: number;
    dfuIDLE: number;
    dfuDOWNLOAD_SYNC: number;
    dfuDNBUSY: number;
    dfuDOWNLOAD_IDLE: number;
    dfuMANIFEST_SYNC: number;
    dfuMANIFEST: number;
    dfuMANIFEST_WAIT_RESET: number;
    dfuUPLOAD_IDLE: number;
    dfuERROR: number;
    STATUS_OK: number;
};
declare class WebDFU {
    readonly device: USBDevice;
    readonly settings: WebDFUOptions;
    private readonly log;
    events: import("nanoevents").Emitter<WebDFUEvent>;
    interfaces: WebDFUSettings[];
    properties?: WebDFUProperties;
    connected: boolean;
    dfuseStartAddress: number;
    dfuseMemoryInfo?: {
        name: string;
        segments: DFUseMemorySegment[];
    };
    currentInterfaceSettings?: WebDFUSettings;
    constructor(device: USBDevice, settings: WebDFUOptions, log: WebDFULog);
    get type(): number;
    init(): Promise<void>;
    connect(interfaceIndex: number): Promise<void>;
    close(): Promise<void>;
    read(xferSize: number, maxSize: number): WebDFUProcessRead;
    write(xfer_size: number, data: ArrayBuffer, manifestationTolerant: boolean): WebDFUProcessWrite;
    // Attempt to read the DFU functional descriptor
    // TODO: read the selected configuration's descriptor
    private getDFUDescriptorProperties;
    private findDfuInterfaces;
    private fixInterfaceNames;
    private readStringDescriptor;
    // @ts-ignore
    private readDeviceDescriptor;
    private readInterfaceNames;
    private readConfigurationDescriptor;
    // Control
    open(): Promise<void>;
    detach(): Promise<number>;
    abort(): Promise<number>;
    waitDisconnected(timeout: number): Promise<unknown>;
    // Status
    isError(): Promise<boolean>;
    getState(): Promise<number>;
    getStatus(): Promise<{
        status: number;
        pollTimeout: number;
        state: number;
    }>;
    clearStatus(): Promise<number>;
    private get intfNumber();
    private requestOut;
    private requestIn;
    private download;
    private upload;
    // IDLE
    private abortToIdle;
    private poll_until;
    private poll_until_idle;
    private do_read;
    private do_write;
    // DFUse specific
    private do_dfuse_write;
    private do_dfuse_read;
    getDfuseSegment(addr: number): DFUseMemorySegment | null;
    getDfuseFirstWritableSegment(): DFUseMemorySegment | null;
    getDfuseMaxReadSize(startAddr: number): number;
    private getDfuseSectorStart;
    private getDfuseSectorEnd;
    private erase;
    private dfuseCommand;
}
export { DFUseMemorySegment, DFUseCommands, WebDFUSettings, WebDFUDeviceDescriptor, WebDFUFunctionalDescriptor, WebDFUInterfaceDescriptor, WebDFUInterfaceSubDescriptor, WebDFUEvent, WebDFUOptions, WebDFUProperties, WebDFULog, WebDFUType, WebDFUError, parseMemoryDescriptor, parseDeviceDescriptor, parseFunctionalDescriptor, parseInterfaceDescriptor, parseSubDescriptors, parseConfigurationDescriptor, dfuCommands, WebDFU };
