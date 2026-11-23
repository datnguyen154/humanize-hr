import { nextCivilDate } from "./calendar-date";

export const HOLIDAY_CATALOG_VERSION = "VN-2026-10-22-r1";
const law = "https://chinhphu.vn/?docid=198540&pageid=27160";
const annual2026 = "https://baochinhphu.vn/bo-noi-vu-thong-bao-lich-nghi-tet-am-lich-va-nghi-le-quoc-khanh-nam-2026-102251017095507785.htm";
const annual2027 = "https://baochinhphu.vn/nghi-tet-am-lich-2027-keo-dai-7-ngay-nghi-quoc-khanh-4-ngay-102261010095648278.htm";
const hung2026 = "https://xaydungchinhsach.chinhphu.vn/lich-nghi-le-gio-to-hung-vuong-30-4-1-5-quoc-khanh-2-9-nam-2026-119260222115822151.htm";

export type HolidayPreset = {
    id: string; year: number; holidayCode: string; name: string; optionLabel: string; dates: string[];
    sourceReference: string; sourceUrls: string[]; suggestedReason: string; verifiedOn: string;
};
const datesFrom = (first: string, count: number) => {
    const dates = [first];
    while (dates.length < count) dates.push(nextCivilDate(dates[dates.length - 1])!);
    return dates;
};
const presets: HolidayPreset[] = [];
function add(year: number, holidayCode: string, name: string, dates: string[], article: string, sourceUrls = [law], option = "default", optionLabel = name) {
    presets.push({ id: `${HOLIDAY_CATALOG_VERSION}:${year}:${holidayCode}:${option}`, year, holidayCode, name, optionLabel, dates,
        sourceReference: `${article}, Bộ luật Lao động 45/2019/QH14; ${sourceUrls.join("; ")}`,
        sourceUrls, suggestedReason: `Thiết lập ${name.toLowerCase()} theo phương án doanh nghiệp xác nhận.`, verifiedOn: "2026-10-22" });
}
// Curated, versioned civil dates, not a lunar calendar or a legal-compliance engine.
for (const year of [2026, 2027]) {
    add(year, "NEW_YEAR", "Tết Dương lịch", [`${year}-01-01`], "Điểm a khoản 1 Điều 112");
    add(year, "LIBERATION_DAY", "Ngày Chiến thắng 30/04", [`${year}-04-30`], "Điểm c khoản 1 Điều 112");
    add(year, "LABOUR_DAY", "Ngày Quốc tế Lao động 01/05", [`${year}-05-01`], "Điểm d khoản 1 Điều 112");
    const annual = year === 2026 ? annual2026 : annual2027;
    for (const adjacent of ["01", "03"]) {
        add(year, "NATIONAL_DAY", "Quốc khánh", [`${year}-09-02`, `${year}-09-${adjacent}`].sort(),
            "Điểm đ khoản 1 Điều 112", [law, annual], adjacent, `02/09 và ${adjacent}/09`);
    }
    const starts = year === 2026 ? ["02-16", "02-15", "02-14"] : ["02-05", "02-04", "02-03"];
    starts.forEach((start, index) => add(year, "TET", "Tết Nguyên đán", datesFrom(`${year}-${start}`, 5),
        "Điểm b khoản 1 Điều 112", [law, annual], `${index + 1}-${4 - index}`,
        `${index + 1} ngày cuối năm và ${4 - index} ngày đầu năm âm lịch`));
}
add(2026, "HUNG_KINGS", "Giỗ Tổ Hùng Vương", ["2026-04-26"], "Điểm e khoản 1 Điều 112", [law, hung2026]);

export function findHolidayPreset(id: string): HolidayPreset | undefined {
    return presets.find((preset) => preset.id === id);
}
export function holidayPresetCatalog(year: number) {
    return { catalogVersion: HOLIDAY_CATALOG_VERSION, year, timezone: "Asia/Ho_Chi_Minh" as const,
        requiresConfirmation: true, presets: presets.filter((preset) => preset.year === year),
        unavailable: ["NEW_YEAR", "TET", "HUNG_KINGS", "LIBERATION_DAY", "LABOUR_DAY", "NATIONAL_DAY"]
            .filter((code) => !presets.some((preset) => preset.year === year && preset.holidayCode === code))
            .map((holidayCode) => ({ holidayCode, reason: "Chưa có dữ liệu ngày đã xác minh cho năm này. Không tự quy đổi âm lịch hoặc đoán lịch." })),
        notice: "Danh mục tham khảo có giới hạn, không phải toàn bộ lịch pháp luật. HR kiểm tra nguồn và xác nhận phương án; không bao gồm tự động nghỉ tuần, nghỉ bù hoặc hoán đổi." };
}
