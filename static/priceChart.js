$( document ).ready(function() {
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

  function getPriceChart(sku, days) {
    $.ajax({
      method: "GET",
      type: "GET",
      url: `https://jjb.zaoshu.so/price/${sku}/detail?days=${days}`,
      timeout: 5000,
      success: function(data){
        if (data.chart.length > 2) {
          $("#jjbPriceChart").html('')
          var chart = new G2.Chart({
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
          chart.render();
        } else {
          $("#jjbPriceChart").html(`<div class="no_data">暂无数据</div>`)
        }
      },
      error: function(xhr, type){
        $("#jjbPriceChart").html(`<div id="retry" class="no_data">查询失败，点击重试</div>`)
        $('#retry').bind('click', () => {
          getPriceChart(sku)
        })
      }
    });
  }

  setTimeout( function(){
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
    $('.jjbPriceChart. select[name=days]').change(function() {
      getPriceChart(sku, $(this).val());
    });
  }, 1000)
});
