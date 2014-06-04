//real time updates query database every few seconds

//get the player id from url
var player_id = document.URL.split('/')[document.URL.split('/').length - 1];

//real time updates
function getRealTimeData() {
  var series = this.series[0];
  var lastUpdate = new Date();
  var x;
  var y;
  var TIMEFIELD = 'dateOf(time)';
  //every 10 seconds query for updates
  setInterval(function() {
    $.ajax({
      url: '/update',
      type: 'GET',
      data: {
        'lastUpdate': lastUpdate,
        'player_id': player_id
      },

      //accepts an array with elements that have fields:
      //'dateOf(time)' and price
      success: function(data) {
        lastUpdate = new Date();
        for (var i = 0; i !== data.length; ++i) {
          x = (new Date(data[i][TIMEFIELD])).getTime();
          y = data[i].price;
          series.addPoint([x, y], true, true);
        }
      }

    });

  }, 10000);
}

//initialize series
function loadData(initdata) {
  var series = [];
  var x;
  var y;
  //do stuff with initialization
  var time = (new Date()).getTime();
  var TIMEFIELD = 'dateOf(time)';
  for (var i = 0; i !== initdata.length; ++i) {
    x = (new Date(initdata[i][TIMEFIELD])).getTime();
    y = initdata[i].price;
    series.push([x, y]);
  }
  return series;
}

var zoom = [
{
  count: 1,
  type: 'minute',
  text: '1m'
}, {
  count: 5,
  type: 'minute',
  text: '5m'
}, {
  count: 30,
  type: 'minute',
  text: '30m'
}, {
  count: 1,
  type: 'hour',
  text: '1h'
}, {
  count: 1,
  type: 'day',
  text: '1d'
}, {
  type: 'all',
  text: 'All'
}];

var colorArray = ["#00ff00", "#90ee7e", "#f45b5b", "#7798BF", "#aaeeee",
  "#ff0066", "#eeaaee", "#55BF3B", "#DF5353", "#7798BF", "#aaeeee"];

var chartFormatter = {
  backgroundColor: {
     linearGradient: { x1: 0, y1: 0, x2: 1, y2: 1 },
     stops: [
        [0, '#2a2a2b'],
        [1, '#3e3e40']
     ]
  },
  style: {
    fontFamily: "'Unica One', sans-serif"
  },
  plotBorderColor: '#606063',
  events : {
    load : getRealTimeData
  }
};

function createGraph(initdata) {
  // Create the chart
  $('#container').highcharts('StockChart', {
    colors: colorArray,

    chart : chartFormatter,
    
    credits: {
      enabled: false
    },

    rangeSelector: {
      buttons: zoom,
      inputEnabled: false,
      selected: 0
    },

    title : {
      text : 'Live random data'
    },

    plotOptions: {
      series: {
        animation: false
      }
    },

    exporting: {
      enabled: false
    },

    series : [{
      name : 'Fantasy Value',
      data : loadData(initdata)
    }]
  });  
}


//create highcharts inside
$(function() {

  //high charts below
  Highcharts.setOptions({
    global : {
      useUTC : false
    }
  });

  $.ajax({
    url: '/data',
    type: 'GET',
    data: {
      'player_id': player_id
    },
    success: function (data) {
      createGraph(data);
    }
  });

});