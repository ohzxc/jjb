$(document).ready(function () {
  let urlInfo = /(https|http):\/\/item.jd.com\/([0-9]*).html/g.exec(window.location.href);
  if (window.location.host == 're.jd.com') {
    urlInfo = /(https|http):\/\/re.jd.com\/cps\/item\/([0-9]*).html/g.exec(window.location.href);
  }
  let sku = urlInfo[2]
  let priceChartDOM = `
    <div class="jjbPriceChart">
      <h4 class="title">
        价格走势
        <select name="days">
          <option value="30">最近30天</option>
          <option value="60">最近60天</option>
          <option value="90">最近90天</option>
        </select>
        <div id="specialPromotion">
        </div>
        <span id="disablePriceChart">&times;</span>
      </h4>
      <div id="jjbPriceChart">
        <div class="ELazy-loading loading">加载中</div>
      </div>
      <span class="provider"><a href="https://blog.jjb.im/price-chart.html" target="_blank">由京价保提供</a></span>
    </div>
  `;
  if ($(".product-intro").length > 0) {
    $(".product-intro").append(priceChartDOM);
  }

  if ($(".first_area_md").length > 0) {
    $(".first_area_md").append(priceChartDOM);
  }

  function timestampToDateNumber(timestamp) {
    let currentDate = new Date(timestamp).toLocaleDateString(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
    return currentDate.replace(/\//g, '');
  }

  var slideIndex = 1;
  function showPromotions(n) {
    var i;
    var x = document.getElementsByClassName("special-promotion-item");
    slideIndex = n
    if (n > x.length) {slideIndex = 1}
    if (n < 1) {slideIndex = x.length} ;
    for (i = 0; i < x.length; i++) {
      x[i].style.display = "none";
    }
    $(`#specialPromotion .controller .item__child`).removeClass('on')
    setTimeout(() => {
      $(`#specialPromotion .controller .item__child:eq(${slideIndex-1})`).addClass('on')
    }, 10);
    console.log('showPromotions', n, slideIndex, x[slideIndex-1])
    x[slideIndex-1].style.display = "block";
  }

  function getPriceChart(sku, days) {
    $.ajax({
      method: "GET",
      type: "GET",
      url: `https://api.zaoshu.so/price/${sku}/detail?days=${days}`,
      timeout: 5000,
      success: function (data) {
        if (data.chart.length > 2) {
          $("#jjbPriceChart").html('')
          let specialPromotion = data.specialPromotion
          let chart = new G2.Chart({
            container: 'jjbPriceChart',
            forceFit: true,
            padding: [50, '5%', 80, '6%'],
            height: 300
          });
          chart.source(data.chart, {
            timestamp: {
              type: 'time',
              mask: 'MM-DD HH:mm',
              range: [0, 1],
              tickCount: 5
            }
          });
          chart.line().position('timestamp*value').shape('hv').color('key');
          chart.tooltip(
            {
              useHtml: true,
              htmlContent: function (title, items) {
                let itemDom = ""
                let promotionsDom = ""
                let promotions = []
                items.forEach(item => {
                  const itemTime = timestampToDateNumber(item.point._origin.timestamp)
                  promotions = data.promotionLogs.find(function (promotion) {
                    return promotion.date == itemTime;
                  });
                  itemDom += `<li style="color:${item.point.color}"><span class="price-type">${item.name}</span>: ${item.value} 元</li>`
                });
                promotions && promotions.detail && promotions.detail.forEach(item => {
                  promotionsDom += `<li><span class="tag">${item.typeName}</span><span class="description">${item.description}</span></li>`
                });
                return `<div class="g2-tooltip">
                  <div class="g2-tooltip-title" style="margin-bottom: 4px;">${title}</div>
                  <ul class="g2-tooltip-list">${itemDom}</ul>
                  <ul class="promotions">${promotionsDom}</ul>
                </div>`
              }
            }
          );

          let specialPromotionDom = ``
          specialPromotion && specialPromotion.forEach(item => {
            specialPromotionDom += `<div class="special-promotion-item"><a class="promotion-item" style="${item.style}" href="${item.url}" target="_break">${item.icon ? `<span class="icon"><img src="${item.icon}"/></span>` : ''}${item.title}</a></div>`
          });
          let specialPromotionControllerDom = ``
          specialPromotion &&specialPromotion.forEach((item, index) => {
            specialPromotionControllerDom += `<span class="item__child" data-index="${index}"></span>`
          });
          $("#specialPromotion").html(`
            <div class="promotions">${specialPromotionDom}</div>
            <div class="controller">${specialPromotionControllerDom}</div>
          `)
          chart.render();
          setTimeout(() => {
            showPromotions(Math.floor(Math.random()*specialPromotion.length) + 1);
            $( "#specialPromotion .controller .item__child" ).live( "click", function() {
              let index = $(this).data('index');
              console.log('index', index)
              showPromotions(index+1)
            });
          }, 50);

          setInterval(() => {
            showPromotions(Math.floor(Math.random()*specialPromotion.length) + 1);
          }, 30000);
        } else {
          $("#jjbPriceChart").html(`<div class="no_data">暂无数据</div>`)
        }
      },
      error: function (xhr, type) {
        $("#jjbPriceChart").html(`<div id="retry" class="no_data">查询失败，点击重试</div>`)
        $('#retry').bind('click', () => {
          getPriceChart(sku)
        })
      }
    });
  }

  setTimeout(function () {
    $('#disablePriceChart').bind('click', () => {
      weui.confirm('停用此功能后京价保将不再在商品页展示价格走势图，同时也将停止上报获取到的商品价格', function () {
        var data = {
          type: "FROM_PAGE",
          text: "disablePriceChart"
        };
        window.postMessage(data, "*");
      }, function () {
        console.log('no')
      }, {
        title: '停用价格走势图'
      });
    })
    getPriceChart(sku)
    $('.jjbPriceChart. select[name=days]').change(function () {
      getPriceChart(sku, $(this).val());
    });
  }, 1000)
});
