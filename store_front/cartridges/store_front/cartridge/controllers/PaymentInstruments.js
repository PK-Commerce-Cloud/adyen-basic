const server = require("server");
server.extend(module.superModule);

const sharedData = require("*/cartridge/scripts/middleware/sharedData");
const inertia = require("*/cartridge/scripts/middleware/inertiaMiddleware");

server.append(
  "AddPayment",
  function (req, res, next) {
    const viewData = res.getViewData();

    res.setViewData({
      template: "Account/AddPayment",
      props: viewData,
    });

    next();
  },
  sharedData.inertiaSharedData,
  inertia.inertiaMiddleware
);

server.append(
  "List",
  function (req, res, next) {
    const viewData = res.getViewData();

    res.setViewData({
      template: "Account/PaymentList",
      props: viewData,
    });

    next();
  },
  sharedData.inertiaSharedData,
  inertia.inertiaMiddleware
);

module.exports = server.exports();
