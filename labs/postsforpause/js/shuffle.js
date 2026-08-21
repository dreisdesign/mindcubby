/* eslint-env browser */
/* eslint-disable no-unused-vars */

(function () {
  var btn = document.getElementById("randomButton");

  btn.addEventListener("click", function () {
    randomUrl();
  });

  function randomUrl() {
    var urls = [
        "./stress-is-temporary.html",
        "./a-better-present-starts-here.html",
        "./just-be-kind.html",
        "./when-in-doubt-just-wait.html",
        "./when-in-doubt-seek-calm.html",
        "./when-in-doubt-slow-down.html",
        "./a-better-future-starts-now.html",
        "./check-less-reduce-stress.html",
        "./pause-inhale-exhale-resume.html",
        "./dont-take-youself-too-seriously.html",
        "./pause-breathe-relax.html",
        "./embrace-reality.html",
        "./awareness-of-fear.html",
        "./see-for-yourself.html",
        "./be-here-now.html",
        "./all-thoughts-come-and-go.html",
        "./loosen-up.html",
        "./one-thing-at-a-time.html",
      ],
      max = urls.length,
      min = 0,
      result,
      link;

    result = Math.floor(randomNum(min, max));
    link = urls[result];
    location.href = link;
  }

  function randomNum(min, max) {
    return Math.random() * (max - min) + min;
  }
})();
