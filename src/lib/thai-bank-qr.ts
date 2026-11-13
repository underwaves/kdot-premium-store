export const THAI_BANK_NAMES: Record<string, string> = {
  "002": "ธนาคารกรุงเทพ (BBL)",
  "004": "ธนาคารกสิกรไทย (KBANK)",
  "006": "ธนาคารกรุงไทย (KTB)",
  "011": "ธนาคารทหารไทยธนชาต (ttb)",
  "014": "ธนาคารไทยพาณิชย์ (SCB)",
  "017": "ซิตี้แบงก์ (CITI)",
  "020": "สแตนดาร์ดชาร์เตอร์ด (SCBT)",
  "022": "ซีไอเอ็มบี ไทย (CIMB)",
  "024": "ธนาคารยูโอบี (UOB)",
  "025": "ธนาคารกรุงศรีอยุธยา (BAY)",
  "030": "ธนาคารออมสิน (GSB)",
  "033": "ธนาคารอาคารสงเคราะห์ (GHB)",
  "034": "ธ.ก.ส. (BAAC)",
  "039": "ธนาคารมิซูโฮ (MHCB)",
  "066": "ธนาคารอิสลามแห่งประเทศไทย",
  "067": "ธนาคารทิสโก้ (TISCO)",
  "069": "เกียรตินาคินภัทร (KKP)",
  "070": "ไอซีบีซี (ไทย)",
  "071": "ธนาคารไทยเครดิต (TCRB)",
  "073": "แลนด์ แอนด์ เฮ้าส์ (LHBANK)",
};

export interface ParsedSlipQr {
  raw: string;
  crcValid: boolean;
  isBankSlipQr: boolean;
  isPaymentRequestQr: boolean;
  bankCode: string | null;
  bankName: string | null;
  transRef: string | null;
  countryCode: string | null;
  reason: string;
}

type TlvNode = { tag: string; value: string };

function parseTlv(input: string): TlvNode[] | null {
  const nodes: TlvNode[] = [];
  let idx = 0;
  while (idx < input.length) {
    if (idx + 4 > input.length) return null;
    const tag = input.slice(idx, idx + 2);
    const lenStr = input.slice(idx + 2, idx + 4);
    if (!/^\d{2}$/.test(tag) || !/^\d{2}$/.test(lenStr)) return null;
    const len = Number.parseInt(lenStr, 10);
    const start = idx + 4;
    const end = start + len;
    if (end > input.length) return null;
    nodes.push({ tag, value: input.slice(start, end) });
    idx = end;
  }
  return nodes;
}

export function computeCrc16CcittFalse(payloadWithoutCrc: string): string {
  const bytes = new TextEncoder().encode(payloadWithoutCrc);
  let crc = 0xffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc ^= bytes[i] << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Parse and cryptographically CRC-verify a Thai Bank MiniQR (BOT / ITMX Standard).
 * Distinguishes between genuine e-slip verification QR (outer tag 00 -> AID 000001 + bankCode + transRef + tag 91 CRC)
 * vs generic PromptPay QR payment codes (000201 + tag 63 CRC), preventing buyers from uploading receive QRs as slips.
 */
export function parseThaiSlipMiniQr(rawInput: string): ParsedSlipQr {
  const raw = rawInput.trim();
  const baseFail = (reason: string, crcValid = false, isPaymentRequestQr = false): ParsedSlipQr => ({
    raw,
    crcValid,
    isBankSlipQr: false,
    isPaymentRequestQr,
    bankCode: null,
    bankName: null,
    transRef: null,
    countryCode: null,
    reason,
  });

  if (raw.length < 16 || raw.length > 512) {
    return baseFail("QR บนรูปไม่ใช่รูปแบบสลิปธนาคาร");
  }

  const outer = parseTlv(raw);
  if (!outer || outer.length < 2) {
    return baseFail("QR บนรูปไม่ใช่โครงสร้าง EMVCo ของธนาคารไทย");
  }

  const last = outer[outer.length - 1];
  const crcTag = last.tag === "91" || last.tag === "63" ? last.tag : null;
  if (!crcTag || last.value.length !== 4 || !/^[0-9A-Fa-f]{4}$/.test(last.value)) {
    return baseFail("QR ไม่มีรหัสตรวจสอบ CRC ท้ายสลิป");
  }

  const payloadBeforeHex = raw.slice(0, raw.length - 4);
  const expectedCrc = computeCrc16CcittFalse(payloadBeforeHex);
  const crcValid = expectedCrc === last.value.toUpperCase();

  if (!crcValid) {
    return baseFail("รหัส CRC ของ QR สลิปไม่ถูกต้อง (อาจถูกแก้ไขหรือภาพไม่ชัด)");
  }

  const tagMap = new Map(outer.map((n) => [n.tag, n.value]));
  const tag00 = tagMap.get("00") ?? "";
  const countryCode = tagMap.get("51") ?? tagMap.get("58") ?? null;

  // Detect PromptPay Receive QR (000201...) uploaded mistakenly/fraudulently instead of transfer slip
  if (tag00 === "01" && (tagMap.has("29") || tagMap.has("30"))) {
    return baseFail("QR นี้เป็นคิวอาร์รับเงิน (PromptPay) ไม่ใช่ QR ยืนยันสลิปโอนเงิน", true, true);
  }

  // Standard BOT/ITMX MiniQR places nested TLV inside Tag 00:
  // 00 = "000001" (Slip Verification AID), 01 = 3-digit sending bank code, 02 = transRef
  const nested = parseTlv(tag00);
  if (!nested) {
    return baseFail("ไม่พบข้อมูลเลขอ้างอิงสลิปใน QR", true);
  }

  const nestedMap = new Map(nested.map((n) => [n.tag, n.value]));
  const aid = nestedMap.get("00");
  const bankCode = nestedMap.get("01") ?? null;
  const transRef = nestedMap.get("02") ?? null;

  if (aid !== "000001" || !bankCode || !transRef || transRef.length < 8) {
    return baseFail("QR ไม่ตรงมาตรฐานสลิปธนาคารไทย (BOT MiniQR)", true);
  }

  const bankName = THAI_BANK_NAMES[bankCode] ?? `รหัสธนาคาร ${bankCode}`;
  return {
    raw,
    crcValid: true,
    isBankSlipQr: true,
    isPaymentRequestQr: false,
    bankCode,
    bankName,
    transRef,
    countryCode,
    reason: `ตรวจพบ QR สลิปจริง: ${bankName} · Ref ${transRef}`,
  };
}
