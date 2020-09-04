window.addSelfOperated = function (a) {
  var e = document.getElementById(a);
  var f = e.value;
  if (f = f.replace(/^\s*(.*?)\s*$/, "$1"), f.length > 100 && (f = f.substring(0, 100)), "" == f) return void(window.location.href = window.location.href);
  $("#key").val(f + ' 自营');
  document.getElementById(a).value = f + ' 自营';
}