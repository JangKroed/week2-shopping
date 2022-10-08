/**
 * mongoose 로그인 검증
 */
// const jwt = require("jsonwebtoken");
// const User = require("../models/user");

// module.exports = (req, res, next) => {
//   const { authorization } = req.headers;
//   const [tokenType, tokenValue] = authorization.split(" ");

//   if (tokenType !== "Bearer") {
//     res.status(401).send({
//       errorMessage: "로그인 후 사용하세요.",
//     });
//     return;
//   }

//   try {
//     const { userId } = jwt.verify(tokenValue, "MySecretKey");

//     User.findById(userId)
//       .exec()
//       .then((user) => {
//         res.locals.user = user;
//         next();
//       });
//   } catch (error) {
//     res.status(401).send({
//       errorMessage: "로그인 후 사용하세요.",
//     });
//     return;
//   }
// };

/**
 * Sequelize 로그인 검증
 */
const jwt = require("jsonwebtoken");
const { User } = require("../models");

module.exports = (req, res, next) => {
  const { authorization } = req.headers;
  const [authType, authToken] = (authorization || "").split(" ");

  if (!authToken || authType !== "Bearer") {
    res.status(401).send({
      errorMessage: "로그인 후 이용 가능한 기능입니다.",
    });
    return;
  }

  try {
    const { userId } = jwt.verify(authToken, "customized-secret-key");
    // mongoose와는 다르게 findByPk라는 메소드 사용
    User.findByPk(userId).then((user) => {
      res.locals.user = user;
      next();
    });
  } catch (err) {
    res.status(401).send({
      errorMessage: "로그인 후 이용 가능한 기능입니다.",
    });
  }
};
