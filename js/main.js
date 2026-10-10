/* =========================================================
   月隐 Tarot —— 通用脚本
   负责：移动端导航菜单、页脚年份、页面转场标记等全站通用小功能
   ========================================================= */

/* 页面转场：只有当浏览器真的建立了「跨文档 View Transition」时才标记 <html>，
   让主内容跳过自己的进入动画，避免根转场与局部动画叠加成两套运动。
   不支持该事件/未发生转场时不做任何事，页面照常显示。不拦截、不延迟导航。 */
window.addEventListener("pagereveal", function (e) {
  if (e && e.viewTransition) {
    document.documentElement.classList.add("vt-active");
  }
});

document.addEventListener("DOMContentLoaded", function () {
  // 移动端：点击汉堡按钮展开 / 收起导航
  var navToggle = document.querySelector(".nav-toggle");
  var siteNav = document.querySelector(".site-nav");

  if (navToggle && siteNav) {
    navToggle.addEventListener("click", function () {
      siteNav.classList.toggle("open");
    });
  }

  // 页脚年份自动更新（如果页面里有 .year 元素）
  var yearEls = document.querySelectorAll(".year");
  var currentYear = new Date().getFullYear();
  yearEls.forEach(function (el) {
    el.textContent = currentYear;
  });
});
