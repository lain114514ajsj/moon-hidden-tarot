/* =========================================================
   月隐 Tarot —— 生日数字计算逻辑
   负责：出生日期校验、数字计算、展示计算过程与解读
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  var dateInput = document.getElementById("birthDate");
  var calcBtn = document.getElementById("calcBtn");
  var errorEl = document.getElementById("error");
  var resultEl = document.getElementById("result");

  // 把日期输入框的最大值限制为今天，避免误选未来日期
  function setMaxDate() {
    var today = new Date();
    var y = today.getFullYear();
    var m = String(today.getMonth() + 1).padStart(2, "0");
    var d = String(today.getDate()).padStart(2, "0");
    dateInput.setAttribute("max", y + "-" + m + "-" + d);
  }

  // 求一个数字各位之和
  function digitSum(num) {
    return String(num)
      .split("")
      .reduce(function (acc, ch) {
        return acc + Number(ch);
      }, 0);
  }

  // 显示错误信息
  function showError(msg) {
    errorEl.textContent = msg || "";
  }

  setMaxDate();

  calcBtn.addEventListener("click", function () {
    var value = dateInput.value;
    showError("");
    resultEl.innerHTML = "";

    // 校验 1：空值
    if (!value) {
      showError("请先选择出生日期。");
      return;
    }

    var parts = value.split("-");
    var year = Number(parts[0]);
    var month = Number(parts[1]);
    var day = Number(parts[2]);

    // 校验 2：日期是否真实存在（例如 2 月 30 日）
    var dateObj = new Date(year, month - 1, day);
    var isValid =
      dateObj.getFullYear() === year &&
      dateObj.getMonth() === month - 1 &&
      dateObj.getDate() === day;

    if (!isValid) {
      showError("这个日期无效，请重新选择。");
      return;
    }

    // 校验 3：未来日期
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateObj > today) {
      showError("出生日期不能是未来日期，请重新选择。");
      return;
    }

    // ---------- 计算生命数字 ----------
    // 把年、月、日拼接成字符串，再拆成每一位数字（保留前导 0，方便展示）
    var digitStr = parts[0] + parts[1] + parts[2];
    var digits = digitStr.split("").map(Number);
    var total = digits.reduce(function (a, b) {
      return a + b;
    }, 0);

    var steps = [];
    steps.push("第一步：把出生日期的每一位数字相加");
    steps.push(digits.join(" + ") + " = " + total);

    var current = total;
    var masterNumbers = [11, 22];

    // 只要结果还是两位及以上、且不是主数，就继续化简
    while (current > 9 && masterNumbers.indexOf(current) === -1) {
      var nums = String(current).split("").map(Number);
      var next = nums.reduce(function (a, b) {
        return a + b;
      }, 0);
      steps.push("继续化简：" + nums.join(" + ") + " = " + next);
      current = next;
    }

    var isMaster = masterNumbers.indexOf(current) !== -1;
    if (isMaster) {
      steps.push("结果 " + current + " 是主数，保留不再化简。");
    }

    // ---------- 展示结果 ----------
    var meaning = BIRTHDAY_MEANINGS[current];
    var stepsHtml = steps
      .map(function (s) {
        return "<p>" + s + "</p>";
      })
      .join("");

    resultEl.innerHTML =
      '<div class="steps">' +
      '<p class="step-highlight">计算过程</p>' +
      stepsHtml +
      "</div>" +
      '<div class="final-number">' +
      '<div class="big">' + current + "</div>" +
      '<div class="label">生命数字' + (isMaster ? "（主数）" : "") + "</div>" +
      "</div>" +
      '<div class="meaning-block">' +
      "<h4>" + meaning.title + "</h4>" +
      "<p>" + meaning.meaning + "</p>" +
      "<p><strong>建议：</strong>" + meaning.advice + "</p>" +
      "</div>";

    resultEl.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});
