declare module "lunar-javascript" {
  export class Solar {
    static fromYmdHms(
      year: number,
      month: number,
      day: number,
      hour: number,
      minute: number,
      second: number
    ): Solar;
    getLunar(): {
      getEightChar(): {
        getYearGan(): string;
        getYearZhi(): string;
        getMonthGan(): string;
        getMonthZhi(): string;
        getDayGan(): string;
        getDayZhi(): string;
        getTimeGan(): string;
        getTimeZhi(): string;
        getYearShiShenGan?(): string;
        getMonthShiShenGan?(): string;
        getDayShiShenGan?(): string;
        getTimeShiShenGan?(): string;
      };
    };
  }
}
