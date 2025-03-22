// Power states
export const POWER_STATES = ["S0", "S1", "S2", "S3", "S4", "S5 (soft-off)", "S4/S5", "Off"];

// Remote Control Commands
export const RCC = {
  reset: "16",
  powerup: "17",
  powerdown: "18",
  powercycle: "19",
} as const;

// Remote Control Special Commands
export const RCCS = {
  nop: "0",
  pxe: "1",
  hd: "2",
  hdsafe: "3",
  diag: "4",
  cd: "5",
} as const;

export const RCCS_OEM = {
  bios: 0xc1,
} as const;

// PT Status codes and messages
export const PT_STATUS: Record<number, string> = {
  0x0: "success",
  0x1: "internal error",
  0x3: "invalid pt_mode",
  0xc: "invalid name",
  0xf: "invalid byte_count",
  0x10: "not permitted",
  0x17: "max limit_reached",
  0x18: "invalid auth_type",
  0x1a: "invalid dhcp_mode",
  0x1b: "invalid ip_address",
  0x1c: "invalid domain_name",
  0x20: "invalid provisioning_state",
  0x22: "invalid time",
  0x23: "invalid index",
  0x24: "invalid parameter",
  0x25: "invalid netmask",
  0x26: "flash write_limit_exceeded",
  0x800: "network if_error_base",
  0x801: "unsupported oem_number",
  0x802: "unsupported boot_option",
  0x803: "invalid command",
  0x804: "invalid special_command",
  0x805: "invalid handle",
  0x806: "invalid password",
  0x807: "invalid realm",
  0x808: "storage acl_entry_in_use",
  0x809: "data missing",
  0x80a: "duplicate",
  0x80b: "eventlog frozen",
  0x80c: "pki missing_keys",
  0x80d: "pki generating_keys",
  0x80e: "invalid key",
  0x80f: "invalid cert",
  0x810: "cert key_not_match",
  0x811: "max kerb_domain_reached",
  0x812: "unsupported",
  0x813: "invalid priority",
  0x814: "not found",
  0x815: "invalid credentials",
  0x816: "invalid passphrase",
  0x818: "no association",
};

export interface AmtConfig {
  host: string;
  port: number;
  protocol: 'http' | 'https';
  username: string;
  password: string;
  debug?: boolean;
}

export interface NetworkInterface {
  handle: string;
  settings: {
    InterfaceMode: string;
    LinkPolicy: string;
    IPv4Parameters?: {
      LocalAddress: number;
      SubnetMask: number;
      DefaultGatewayAddress: number;
      PrimaryDnsAddress: number;
      SecondaryDnsAddress: number;
    };
  };
}
