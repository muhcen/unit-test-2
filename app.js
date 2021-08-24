const Dinero = require("dinero.js");
const moment = require("moment");
const db = require("./db.json");
function usePromotionCode(promotion, userId) {
  checkTimeSpan(promotion);
  checkUser(promotion, userId);
  checkMaxUsage(promotion);
  checkUsage(promotion, userId);
  return true;
}

function checkTimeSpan(promotion) {
  if (
    moment(promotion.startDate).isAfter(moment()) ||
    moment(promotion.endDate).isSameOrBefore(moment())
  ) {
    throw new Error("The promotion code has expired");
  }
}
function checkUser(promotion, userId) {
  if (promotion.users?.length > 0 && !promotion.users?.includes(userId)) {
    throw new Error("The promotion code does not belong to you.");
  }
}
function checkMaxUsage(promotion) {
  if (promotion.maxUsage && promotion.maxUsage <= promotion.currentUsage) {
    throw new Error("The promotion code has reached to maximum usage.");
  }
}
function checkUsage(promotion, user) {
  const usedCode = db.find((c) => {
    return c.user === user && c.code === promotion.code;
  });
  if (usedCode) {
    throw new Error("This user has used this code.");
  }
}
function applyPromotion(final, promotion) {
  final = Dinero(final);
  let priceBeforePromotion = final;

  let amountObject = {
    amount: 0,
    currency: "GBP",
    precision: 2,
  };
  if (promotion.discount) {
    final = final.subtract(
      Dinero(
        ConvertToDineroFormat({
          amount: promotion.discount.amount * 100,
          currency: promotion.discount.currencyCode,
        })
      )
    );
  }

  if (promotion.percent) {
    let percentDiscount = final.multiply(promotion.percent).divide(100);

    percentDiscount =
      promotion.maxDiscount &&
      percentDiscount.greaterThan(
        Dinero(
          ConvertToDineroFormat({
            amount: promotion.maxDiscount.amount * 100,
            currency: promotion.maxDiscount.currencyCode,
          })
        )
      )
        ? Dinero(
            ConvertToDineroFormat({
              amount: promotion.maxDiscount.amount * 100,
              currency: promotion.maxDiscount.currencyCode,
            })
          )
        : percentDiscount;
    final = final.subtract(percentDiscount);
  }
  final = final.lessThanOrEqual(Dinero(amountObject))
    ? Dinero(amountObject)
    : final;
  console.log({
    final: ConvertToStandardFormat({
      amount: final.getAmount(),
      currency: final.getCurrency(),
      precision: 2,
    }),
    promotion: ConvertToStandardFormat({
      amount: priceBeforePromotion.subtract(final).getAmount(),
      currency: priceBeforePromotion.subtract(final).getCurrency(),
      precision: 2,
    }),
  });
  return {
    final: ConvertToStandardFormat({
      amount: final.getAmount(),
      currency: final.getCurrency(),
      precision: 2,
    }),
    promotion: ConvertToStandardFormat({
      amount: priceBeforePromotion.subtract(final).getAmount(),
      currency: priceBeforePromotion.subtract(final).getCurrency(),
      precision: 2,
    }),
  };
}
function ConvertToDineroFormat(price) {
  return {
    amount: price.amount,
    currency: price.currency,
    precision: 2,
  };
}
function ConvertToStandardFormat(price) {
  return {
    amount: Dinero(price).toFormat("0,0.00"),
    currencyCode: price.currency,
  };
}
module.exports = function checkCode(promotion, userId, final) {
  usePromotionCode(promotion, userId);
  return applyPromotion(final, promotion);
};

// checkCode(
//   {
//     maxUsage: 10,
//     currentUsage: 0,
//     code: "test1",
//     startDate: "2021-08-15T11:30:00.000+00:00",
//     endDate: "2021-09-22T11:30:00.000+00:00",
//     percent: 100,
//     discount: { amount: 2, currencyCode: "GBP" },
//     maxDiscount: {
//       //its 1 GBP
//       amount: 2,
//       currencyCode: "GBP",
//     },
//     users: ["a"],
//   },
//   "a",
//   {
//     //its 10 GBP
//     amount: 1000,
//     currency: "GBP",
//     precision: 2,
//   }
// );
