const app = require("./../app");

describe("test app", () => {
  let res;
  let userId;
  let promotion;
  const set = () => {
    userId = "a";
    promotion = {
      maxUsage: 10,
      currentUsage: 0,
      code: "test1",
      startDate: "2021-08-15T11:30:00.000+00:00",
      endDate: "2021-09-22T11:30:00.000+00:00",
      percent: 0,
      maxDiscount: {
        //its 1 GBP
        amount: 1,
        currencyCode: "GBP",
      },
      users: ["a"],
    };
  };
  const exc = () => {
    res = app(promotion, userId, {
      //its 10 GBP
      amount: 1000,
      currency: "GBP",
      precision: 2,
    });
  };

  it("should be defined", () => {
    set();
    exc();

    expect(res).toBeDefined();
  });
  it("throw error : The promotion code has expired", () => {
    set();
    promotion.endDate = "2021-08-22T11:30:00.000+00:00";

    expect(() => {
      exc();
    }).toThrow();
  });
  it("throw error : The promotion code does not belong to you", () => {
    set();
    userId = "b";
    expect(() => {
      exc();
    }).toThrow();
  });

  it("throw error : The promotion code has reached to maximum usage", () => {
    set();
    promotion.maxUsage = -1;
    expect(() => {
      exc();
    }).toThrow();
  });
  it("throw error : This user has used this code", () => {
    set();
    promotion.code = "test";
    expect(() => {
      exc();
    }).toThrow();
  });
  it("check if we have discount", () => {
    set();
    promotion.discount = { amount: 1, currencyCode: "GBP" };
    exc();
    const amount =
      promotion.maxUsage -
      (promotion.maxUsage * promotion.discount.amount) / 10;
    expect(res.final.amount * 1).toEqual(amount);
  });
  it("check if we have precent", () => {
    set();
    promotion.percent = 5;
    exc();
    const amount =
      promotion.maxUsage - (promotion.maxUsage * promotion.percent) / 100;
    expect(res.final.amount * 1).toEqual(amount);
  });
  it("check if we have maxdiscount", () => {
    set();
    promotion.percent = 100;
    promotion.maxDiscount = { amount: 2, currencyCode: "GBP" };
    exc();
    const amount =
      promotion.maxUsage -
      (promotion.maxUsage * promotion.maxDiscount.amount) / 10;
    expect(res.final.amount * 1).toEqual(amount);
  });
});
