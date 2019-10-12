var Basic = {
  curMsgContainerHeight: 50,
  yAxisWidth: 50,
  xAxisHeight: 30,
  chartPd: 10,
  kLineWidth: 20,
  kLineMarginRight: 10,
  signWidth: 20,
  canvasPaddingLeft: 10,
  signR: 15,
  upColor: '#26a69a',
  downColor: '#ef5350',
  buySignBg: '#4fc3f7',
  sellSignBg: '#fdd835'
}

function QTChart (divElement) {
  this.DivElement = divElement;
  this.TopToolContainer = new TopToolContainer()
  this.TopToolDiv = this.TopToolContainer.Create()
  this.DivElement.appendChild(this.TopToolDiv)
  var _self = this
  $("#go-date").click(
    function (e) {
      var inputText = $("#dateinput").val()
      console.log(inputText)
      var datas = Basic.OrignDatas
      if (!datas) return
      var scrollKIndex = 0
      for (var i in datas) {
        let lastD = null
        let lastTimeStamp = null
        const kD = new Date(datas[i].day)
        const scrollToDate = new Date(inputText)
        if (i > 0) {
          lastD = new Date(datas[i - 1].day)
          lastTimeStamp = lastD.getTime(lastD) / 1000
        }
        const kTimeStamp = kD.getTime(kD) / 1000
        const sDTimeStamp = scrollToDate.getTime(scrollToDate) / 1000
        if (kTimeStamp === sDTimeStamp) {
          scrollKIndex = i
          break
        } else if (i !== 0 && lastTimeStamp === sDTimeStamp) {
          scrollKIndex = i
          break
        } else if (kTimeStamp > sDTimeStamp && i !== 0 && sDTimeStamp > lastTimeStamp) {
          scrollKIndex = i
          break
        }
      }
      scrollKIndex = parseInt(scrollKIndex)
      if (scrollKIndex >= Basic.OrignDatas.length - 1) {
        _self.DataCurIndex = Basic.OrignDatas.length - 1
        _self.DataPreIndex = _self.DataCurIndex - Basic.ScreenKNum
      } else if (scrollKIndex <= Basic.ScreenKNum - 1) {
        _self.DataCurIndex = Basic.ScreenKNum - 1
        _self.DataPreIndex = 0
      } else {
        _self.DataCurIndex = scrollKIndex
        _self.DataPreIndex = scrollKIndex - Basic.ScreenKNum + 1
      }
      console.log('go-date', scrollKIndex, _self.DataPreIndex, _self.DataCurIndex)
      _self.SetUpdate()
    }
  );

  this.CanvasElement = document.createElement("canvas");
  this.CanvasElement.className = 'jschart-drawing';
  this.CanvasElement.setAttribute("tabindex", 0);
  this.CanvasElement.id = Guid();

  this.OptCanvasElement = document.createElement("canvas");
  this.OptCanvasElement.className = 'jschart-opt-drawing';
  this.OptCanvasElement.id = Guid();

  this.DivElement.appendChild(this.CanvasElement);
  this.DivElement.appendChild(this.OptCanvasElement);

  this.Canvas = this.CanvasElement.getContext('2d')
  this.OptCanvas = this.OptCanvasElement.getContext('2d')
  this.isDrag = false
  this.MoveStartX = null
  this.MoveEndX = null
  this.MouseDrag
  this.StepPixel = 4
  this.OnSize = function () {
    //画布大小通过div获取
    var height = parseInt(this.DivElement.style.height.replace("px", ""));
    if (this.TopToolDiv) {
      //TODO调整工具条大小
      height -= this.TopToolDiv.style.height.replace("px", "");   //减去工具条的高度
    }

    this.CanvasElement.height = height;
    this.CanvasElement.width = parseInt(this.DivElement.style.width.replace("px", ""));
    this.CanvasElement.style.width = this.CanvasElement.width + 'px';
    this.CanvasElement.style.height = this.CanvasElement.height + 'px';

    this.OptCanvasElement.height = height
    this.OptCanvasElement.width = parseInt(this.DivElement.style.width.replace("px", ""))
    this.OptCanvasElement.style.width = this.OptCanvasElement.width + 'px';
    this.OptCanvasElement.style.height = this.OptCanvasElement.height + 'px';

    Basic.width = parseInt(this.CanvasElement.style.width.replace("px", ""))
    Basic.height = parseInt(this.CanvasElement.style.height.replace("px", ""))

    var pixelTatio = GetDevicePixelRatio(); //获取设备的分辨率，物理像素与css像素的比值
    this.CanvasElement.height *= pixelTatio;
    this.CanvasElement.width *= pixelTatio;
    this.OptCanvasElement.height *= pixelTatio;
    this.OptCanvasElement.width *= pixelTatio;
  }

  this.SetOption = function (options) {
    this.ChartArray = options.chartArray.sort(sortBy('index'))
    var canvasHeight = parseInt(this.CanvasElement.style.height.replace("px", ""))
    var addHeight = 0
    // 计算各个图表在Canvas中的位置坐标
    for (var j in this.ChartArray) {
      this.ChartArray[j].name == 'kline' && (this.ChartArray[j].datas = this.BindKSignData(this.ChartArray[j])) && (Basic.OrignDatas = this.ChartArray[j].datas)
      this.ChartArray[j].cHeight = (canvasHeight - Basic.xAxisHeight) * this.ChartArray[j].cHeightRatio
      this.ChartArray[j].cStartX = 0
      this.ChartArray[j].cStartY = addHeight
      this.ChartArray[j].cEndX = parseInt(this.CanvasElement.style.width.replace("px", ""))
      this.ChartArray[j].cEndY = this.ChartArray[j].cHeight + addHeight
      addHeight += this.ChartArray[j].cHeight
    }
    this.CalSceenKNum()
    this.DataPreIndex = Basic.OrignDatas.length - Math.floor(Basic.ScreenKNum)
    this.DataCurIndex = Basic.OrignDatas.length - 1
    this.SplitDatas(this.DataPreIndex, this.DataCurIndex)
    this.Draw()
  }

  this.SetOnSizeChange = function () {
    var canvasHeight = parseInt(this.CanvasElement.style.height.replace("px", ""))
    var addHeight = 0
    for (var j in this.ChartArray) {
      this.ChartArray[j].cHeight = (canvasHeight - Basic.xAxisHeight) * this.ChartArray[j].cHeightRatio
      this.ChartArray[j].cStartX = 0
      this.ChartArray[j].cStartY = addHeight
      this.ChartArray[j].cEndX = parseInt(this.CanvasElement.style.width.replace("px", ""))
      this.ChartArray[j].cEndY = this.ChartArray[j].cHeight + addHeight
      addHeight += this.ChartArray[j].cHeight
    }
    this.CalSceenKNum()
    this.DataPreIndex = Basic.OrignDatas.length - Math.floor(Basic.ScreenKNum)
    this.DataCurIndex = Basic.OrignDatas.length - 1
    this.SetUpdate()
  }

  this.BindKSignData = function (option) {
    let kDatas = option.datas
    let signDatasList = option.signDatasList
    for (let i in kDatas) {
      for (let j in signDatasList) {
        var kD = new Date(kDatas[i].day)
        var signD = new Date(signDatasList[j].time)
        let lastD = null
        let lastTimeStamp = null
        if (i > 0) {
          lastD = new Date(kDatas[i - 1].day)
          lastTimeStamp = lastD.getTime(lastD) / 1000
        }
        var kTimeStamp = kD.getTime(kD) / 1000
        var signTimeStamp = signD.getTime(signD) / 1000
        if (kTimeStamp === signTimeStamp) {
          kDatas[i].signObj = signDatasList[j]
        } else if (i !== 0 && lastTimeStamp === signTimeStamp) {
          kDatas[i - 1].signObj = signDatasList[j]
        } else if (kTimeStamp > signTimeStamp && i !== 0 && signTimeStamp > lastTimeStamp) {
          kDatas[i].signObj = signDatasList[j]
        }
      }
    }
    return kDatas
  }

  this.SplitDatas = function (pre, cur) {
    for (var i in this.ChartArray) {
      if (!cur || cur >= Basic.OrignDatas.length - 1) {
        this.ChartArray[i].datas = Basic.OrignDatas.slice(pre)
      } else if (pre >= 0) {
        this.ChartArray[i].datas = Basic.OrignDatas.slice(pre, cur + 1)
      }
      console.log('splice after datas:', pre, cur, this.ChartArray[i].datas)
    }
  }

  this.CalSceenKNum = function () {
    Basic.ScreenKNum = Math.floor((Basic.width - Basic.yAxisWidth - Basic.canvasPaddingLeft) / (Basic.kLineWidth + Basic.kLineMarginRight))
    console.log('update', Basic.width, Basic.ScreenKNum)
  }

  this.SetUpdate = function () {
    this.SplitDatas(this.DataPreIndex, this.DataCurIndex)
    this.Canvas.clearRect(0, 0, Basic.width, Basic.height)
    for (var i in this.ChartArray) {
      switch (this.ChartArray[i].name) {
        case 'kline':
          this.xAxisChart.SetUpdateXAxis(this.ChartArray[i])
          this.ChartArray[i].yRange = this.kLineChart.SetUpdateKLineChart(this.ChartArray[i])
          break;
      }
    }
  }

  this.AddChartUpdate = function () {

  }

  this.OnMouseMove = function (start, end) {
    var pre = this.DataPreIndex
    var cur = this.DataCurIndex
    var dataStep = parseInt(end - start)

    if (dataStep > 0) {
      // 画布向右拖动，数据往左移动
      pre != 0 && (pre-- , cur--)
    } else if (dataStep < 0) {
      // 画布向左拖动，数据往右移动
      cur != Basic.OrignDatas.length - 1 && (cur++ , pre++)
    }
    this.DataPreIndex = pre
    this.DataCurIndex = cur
    console.log(pre, cur)
    this.SetUpdate()
    if (pre == this.DataPreIndex || cur == this.DataCurIndex) return
  }

  var _self = this
  this.OptCanvasElement.onmousemove = function (e) {
    if (!this.isDrag) {
      _self.onDrawCursor(e.offsetX, e.offsetY)
      return
    }
    _self.OptCanvas.clearRect(0, 0, Basic.width, Basic.height)
    _self.OnMouseMove(this.MoveStartX, e.clientX)
    this.MoveStartX = e.clientX
  }
  this.OptCanvasElement.onmousedown = function (e) {
    this.isDrag = true
    this.MoveStartX = e.clientX
  }
  this.OptCanvasElement.onmouseup = function (e) {
    this.isDrag = false
  }
  this.OptCanvasElement.onmousewheel = function (e) {
    _self.onKLineScale(e.wheelDelta)
  }

  this.Draw = function () {
    for (var i in this.ChartArray) {
      switch (this.ChartArray[i].name) {
        case 'kline':
          var xAxisChart = new XAxis(this.Canvas, this.ChartArray[i])
          var kLineChart = new KLinesChart(this.Canvas, this.ChartArray[i])
          this.xAxisChart = xAxisChart
          this.kLineChart = kLineChart
          this.xAxisChart.Create()
          this.ChartArray[i].yRange = this.kLineChart.Create()
          break;
      }
    }
  }

  this.onDrawCursor = function (x, y) {
    // 绘制虚线
    this.OptCanvas.clearRect(0, 0, Basic.width, Basic.height)
    this.OptCanvas.beginPath()
    this.OptCanvas.strokeStyle = '#666'
    this.OptCanvas.lineWidth = 1
    this.OptCanvas.setLineDash([5, 5])
    this.OptCanvas.moveTo(ToFixedPoint(x), 0)
    this.OptCanvas.lineTo(ToFixedPoint(x), ToFixedPoint(Basic.height - Basic.xAxisHeight))

    this.OptCanvas.moveTo(0, ToFixedPoint(y))
    this.OptCanvas.lineTo(ToFixedPoint(Basic.width - Basic.yAxisWidth), ToFixedPoint(y))
    this.OptCanvas.stroke()
    this.OptCanvas.closePath()

    // 当前光标所处的K线位置
    let kn = Math.ceil(
      (x - Basic.canvasPaddingLeft) /
      (Basic.kLineWidth + Basic.kLineMarginRight)
    )
    if (kn > this.ChartArray[0].datas.length) {
      kn = this.ChartArray[0].datas.length
    } else if (kn <= 0) {
      kn = 1
    }

    // 绘制X轴的时间标识
    this.OptCanvas.beginPath()
    this.OptCanvas.font = '12px san-serif'
    Basic.curKIndex = kn - 1
    var curKMsg = this.ChartArray[0].datas[kn - 1]
    var tw = this.OptCanvas.measureText(curKMsg.day).width
    console.log(curKMsg.day, tw)

    this.OptCanvas.fillStyle = '#333'
    this.OptCanvas.fillRect(x - tw / 2 - 10, Basic.height - Basic.xAxisHeight + 5, tw + 20, 15)

    this.OptCanvas.beginPath()
    this.OptCanvas.fillStyle = '#fff'
    this.OptCanvas.fillText(curKMsg.day, x - tw / 2, Basic.height - Basic.xAxisHeight + 17)
    this.OptCanvas.closePath()
    this.OptCanvas.stroke()

    let chartConfig = null
    for (let i in this.ChartArray) {
      if (y > this.ChartArray[i].cStartY && y < this.ChartArray[i].cEndY) {
        chartConfig = this.ChartArray[i]
      }
    }
    if (!chartConfig) {
      return
    }
    let unitPxNum = (chartConfig.yRange.maxData - chartConfig.yRange.minData) / (chartConfig.cHeight - Basic.curMsgContainerHeight - Basic.chartPd) // 每单位PX占多大值
    let yNum = ((chartConfig.cEndY - y - Basic.chartPd) * unitPxNum + chartConfig.yRange.minData).toFixed(2)
    if (chartConfig.yRange.isBig) {
      yNum = (yNum / 1000).toFixed(3) + 'k'
    }
    var ytw = this.OptCanvas.measureText(yNum).width
    // 绘制Y轴的值标识
    this.OptCanvas.beginPath()
    this.OptCanvas.fillStyle = '#333'
    this.OptCanvas.fillRect(Basic.width - Basic.yAxisWidth, y - 10, ytw + 20, 20)
    this.OptCanvas.closePath()
    this.OptCanvas.stroke()

    this.OptCanvas.beginPath()
    this.OptCanvas.font = '12px san-serif'
    this.OptCanvas.fillStyle = '#fff'
    this.OptCanvas.fillText(yNum, Basic.width - Basic.yAxisWidth + 5, y + 5)
    this.OptCanvas.closePath()
    this.OptCanvas.stroke()

    for (let a in this.ChartArray) {
      if (this.ChartArray[a].datas instanceof Array) {
        let o = {}
        if (this.ChartArray[a].name === 'kline') {
          o = this.ChartArray[a].datas[Basic.curKIndex]
        } else if (this.ChartArray[a].name === 'volume') {
          o['volume'] = this.ChartArray[a].datas[Basic.curKIndex].volume
        }
        this.ChartArray[a].curMsg = o
      } else if (this.ChartArray[a].datas instanceof Object) {
        let o = {}
        for (let b in this.ChartArray[a].datas) {
          o[b] = (this.ChartArray[a].datas[b][Basic.curKIndex]).toFixed(2)
        }
        this.ChartArray[a].curMsg = o
      }
    }
    this.onDrawCurMsg()
  }

  this.onDrawCurMsg = function () {
    for (let c in this.ChartArray) {
      switch (this.ChartArray[c].name) {
        case 'kline':
          this.kLineChart.DrawCurMsg(this.OptCanvas, this.ChartArray[c])
          break;
      }
    }
  }

  this.onKLineScale = function (type) {
    if (type >= 0) {
      Basic.kLineWidth += 2
      Basic.kLineMarginRight += 1
      Basic.kLineWidth > 40 && (Basic.kLineWidth = 40)
      Basic.kLineMarginRight > 30 && (Basic.kLineMarginRight = 30)
    } else {
      Basic.kLineWidth -= 2
      Basic.kLineMarginRight -= 1
      Basic.kLineWidth < 6 && (Basic.kLineWidth = 6)
      Basic.kLineMarginRight < 2 && (Basic.kLineMarginRight = 2)
    }
    this.CalSceenKNum()
    this.DataPreIndex = Basic.OrignDatas.length - Math.floor(Basic.ScreenKNum)
    this.DataCurIndex = Basic.OrignDatas.length - 1
    this.SetUpdate()
  }
}

// 顶部工具栏
function TopToolContainer () {
  this.TopTool
  this.Create = function (callback) {
    this.TopTool = document.createElement('div')
    this.TopTool.className = 'top-tool-container pl'
    this.TopTool.id = Guid()
    this.TopTool.style.height = '44px'
    this.TopTool.style.lineHeight = '44px'
    this.TopTool.innerHTML =
      ' <input id="dateinput" value="2019-08-20 14:00:00" class="go-date-input" />\n' +
      ' <button id="go-date" class="go-date">跳转</button>\n'
    return this.TopTool
  }
}
// K线控件
function KLinesChart (canvas, option) {
  this.Canvas = canvas
  this.Option = option
  this.Datas = option.datas
  this.YNumpx = 0
  this.StartX = 0
  this.StartY = 0
  this.EndX = 0
  this.EndY = 0
  this.YAxisChart

  this.Create = function () {
    this.YAxisChart = new YAxis(this.Canvas, this.Option)
    this.YAxisChart.Create()
    this.YNumpx = (this.Option.cHeight - Basic.curMsgContainerHeight - Basic.chartPd) / (this.YAxisChart.MaxDatas - this.YAxisChart.MinDatas)
    for (var i = 0, j = this.Datas.length; i < j; i++) {
      this.DrawKLines(i, parseFloat(this.Datas[i].open), parseFloat(this.Datas[i].close), parseFloat(this.Datas[i].high), parseFloat(this.Datas[i].low))
      this.Datas[i].signObj && this.DrawTradeSign(i, this.Datas[i])
    }
    let range = {
      minData: this.YAxisChart.MinDatas,
      maxData: this.YAxisChart.MaxDatas
    }
    return range
  }

  this.DrawCurMsg = function (canvas, option) {
    let curMsg = option.curMsg
    let text = option.goodsName + ':' + '开=' + curMsg.open + ',' + '关=' + curMsg.close + ',' + '高=' + curMsg.high + ',' + '低=' + curMsg.low + ',' + '量=' + curMsg.volume
    canvas.beginPath()
    canvas.font = "18px Verdana"
    canvas.fillStyle = "#333"
    canvas.fillText(text, option.cStartX + 10, option.cStartY + 20)
    canvas.closePath()
    canvas.stroke()
  }

  this.DrawKLines = function (i, open, close, high, low) {
    var startX, startY, endX, endY, lowpx, highpx
    this.Canvas.beginPath()
    if (open < close) {
      // 上涨
      this.Canvas.fillStyle = Basic.upColor
      this.Canvas.strokeStyle = Basic.upColor
      startY = this.Option.cHeight - Basic.curMsgContainerHeight - Basic.chartPd - (close - this.YAxisChart.MinDatas) * this.YNumpx + Basic.curMsgContainerHeight + this.Option.cStartY
      endY = this.Option.cHeight - Basic.curMsgContainerHeight - Basic.chartPd - (open - this.YAxisChart.MinDatas) * this.YNumpx + Basic.curMsgContainerHeight + this.Option.cStartY
    } else if (open > close) {
      // 下跌
      this.Canvas.fillStyle = Basic.downColor
      this.Canvas.strokeStyle = Basic.downColor
      startY = this.Option.cHeight - Basic.curMsgContainerHeight - Basic.chartPd - (open - this.YAxisChart.MinDatas) * this.YNumpx + Basic.curMsgContainerHeight + this.Option.cStartY
      endY = this.Option.cHeight - Basic.curMsgContainerHeight - Basic.chartPd - (close - this.YAxisChart.MinDatas) * this.YNumpx + Basic.curMsgContainerHeight + this.Option.cStartY
    } else {
      // 平
      this.Canvas.fillStyle = '#666'
      this.Canvas.strokeStyle = '#666'
      startY = this.Option.cHeight - Basic.curMsgContainerHeight - Basic.chartPd - (open - this.YAxisChart.MinDatas) * this.YNumpx + Basic.curMsgContainerHeight + this.Option.cStartY
      endY = this.Option.cHeight - Basic.curMsgContainerHeight - Basic.chartPd - (open - this.YAxisChart.MinDatas) * this.YNumpx + Basic.curMsgContainerHeight + this.Option.cStartY
    }
    startX = Basic.canvasPaddingLeft + (Basic.kLineWidth + Basic.kLineMarginRight) * i + this.Option.cStartX
    endX = startX + Basic.kLineWidth
    highpx = this.Option.cHeight - Basic.curMsgContainerHeight - Basic.chartPd - (high - this.YAxisChart.MinDatas) * this.YNumpx + this.Option.cStartY + Basic.curMsgContainerHeight
    lowpx = this.Option.cHeight - Basic.curMsgContainerHeight - Basic.chartPd - (low - this.YAxisChart.MinDatas) * this.YNumpx + this.Option.cStartY + Basic.curMsgContainerHeight
    this.Canvas.fillRect(ToFixedRect(startX), ToFixedRect(startY), ToFixedRect(endX - startX), ToFixedRect((endY - startY) == 0 ? 1 : (endY - startY)))
    // config.basic.mainctx.setLineDash(0)
    this.Canvas.lineWidth = 1
    this.Canvas.moveTo(ToFixedPoint(startX + Basic.kLineWidth / 2), ToFixedPoint(highpx))
    this.Canvas.lineTo(ToFixedPoint(startX + Basic.kLineWidth / 2), ToFixedPoint(lowpx))
    this.Canvas.stroke()
    this.Canvas.closePath()

  }

  this.DrawTradeSign = function (i, curMsg) {
    this.Canvas.beginPath()
    let centerX = Basic.canvasPaddingLeft + (Basic.kLineWidth + Basic.kLineMarginRight) * i + (Basic.kLineWidth / 2) + this.Option.cStartX
    let centerY = 0
    let r = Basic.signR
    let signType
    if (curMsg.signObj.type === 'buy') {
      signType = '买'
      centerY = this.Option.cHeight - Basic.curMsgContainerHeight - Basic.chartPd - (curMsg.low - this.YAxisChart.MinDatas) * this.YNumpx + r + this.Option.cStartY + Basic.curMsgContainerHeight
      this.Canvas.fillStyle = Basic.buySignBg
    } else {
      signType = '卖'
      centerY = this.Option.cHeight - Basic.curMsgContainerHeight - Basic.chartPd - (curMsg.high - this.YAxisChart.MinDatas) * this.YNumpx - r + this.Option.cStartY + Basic.curMsgContainerHeight
      this.Canvas.fillStyle = Basic.sellSignBg
    }
    this.Canvas.arc(centerX, centerY, r, 0, 2 * Math.PI)
    this.Canvas.fill()

    this.Canvas.beginPath()
    this.Canvas.font = '14px san-serif'
    this.Canvas.fillStyle = '#fff'
    this.Canvas.fillText(signType, (centerX - r / 2), centerY + r / 2.8)
    this.Canvas.stroke()
    this.Canvas.closePath()

    this.Canvas.beginPath()
    this.Canvas.font = '14px san-serif'
    this.Canvas.fillStyle = '#333'
    this.Canvas.fillText(curMsg.signObj.price, centerX + r + 5, centerY + r / 2)
    this.Canvas.stroke()
    this.Canvas.closePath()
  }

  this.SetUpdateKLineChart = function (option) {
    console.log('update index: k')
    this.Option = option
    this.Datas = option.datas
    // this.Canvas.clearRect(option.cStartX, option.cStartY, option.cEndX - option.cStartX, option.cEndY - option.cStartY)
    this.YAxisChart.SetUpdateYAxis(this.Option)
    this.YNumpx = (this.Option.cHeight - Basic.curMsgContainerHeight - Basic.chartPd) / (this.YAxisChart.MaxDatas - this.YAxisChart.MinDatas)
    for (var i = 0, j = this.Datas.length; i < j; i++) {
      this.DrawKLines(i, parseFloat(this.Datas[i].open), parseFloat(this.Datas[i].close), parseFloat(this.Datas[i].high), parseFloat(this.Datas[i].low))
      this.Datas[i].signObj && this.DrawTradeSign(i, this.Datas[i])
    }
    let range = {
      minData: this.YAxisChart.MinDatas,
      maxData: this.YAxisChart.MaxDatas
    }
    return range
  }
}
// Y轴画法
function YAxis (canvas, option) {
  this.Canvas = canvas
  this.StartX = option.cEndX - Basic.yAxisWidth
  this.StartY = option.cStartY + Basic.curMsgContainerHeight
  this.EndX = option.cEndX
  this.EndY = option.cEndY - Basic.chartPd
  this.Datas = option.datas
  this.YPoints = []
  this.YTexts = []
  this.MinDatas
  this.MaxDatas
  this.isBigNum // 判断值是否大于5位数，大于5位数 值 在展示的时候末尾要加上 k

  this.Create = function () {
    this.SetValueRange()
    this.Draw()
  }

  this.SetValueRange = function () {
    this.YPoints = []
    // 值得 切割代码待完善
    // 处理两种数据类型
    if (this.Datas instanceof Array) {
      this.MinDatas = Math.min.apply(
        Math, this.Datas.map(function (o) { return o.low })
      )
      this.MaxDatas = Math.max.apply(
        Math, this.Datas.map(function (o) { return o.high })
      )
    } else {
      var dataArray = []
      for (var i in this.Datas) {
        for (var j in this.Datas[i]) {
          dataArray.push(this.Datas[i][j])
        }
      }
      this.MinDatas = Math.min.apply(
        Math, dataArray.map(function (o) { return o })
      )
      this.MaxDatas = Math.max.apply(
        Math, dataArray.map(function (o) { return o })
      )
    }

    var fixArray = [0.1, 0.01, 0.001, 0.0001, 0.00001, 0.000001, 0.0000001]
    // 判断值是否大于等于6位数，是的话 以 k 为单位
    if (((Math.ceil(this.MaxDatas)).toString().length) >= 6) {
      this.isBigNum = true
      this.MinDatas = this.MinDatas / 1000
      this.MaxDatas = this.MaxDatas / 1000
    }
    // 计算最大值和最小值，分别向上取整和向下取整
    var minDataLength = (Math.floor(this.MinDatas)).toString().length
    var maxDataLength = (Math.ceil(this.MaxDatas)).toString().length
    if (minDataLength >= 3) {
      this.MinDatas = Math.floor(this.MinDatas * fixArray[minDataLength - 3]) / fixArray[minDataLength - 3]
    }
    if (maxDataLength >= 3) {
      this.MaxDatas = Math.ceil(this.MaxDatas * fixArray[maxDataLength - 3]) / fixArray[maxDataLength - 3]
    }

    var limit = (this.MaxDatas - this.MinDatas) / 4
    if (minDataLength > 2) {
      limit = Math.ceil(limit)
    }
    var unitPx = (this.EndY - this.StartY) / (this.MaxDatas - this.MinDatas)

    // 添加 YPoints ， 里面包含y值和 y轴上的位置
    for (var a = 0; a <= 4; a++) {
      var value = this.MaxDatas - a * limit > this.MinDatas ? this.MaxDatas - a * limit : this.MinDatas
      var yPosition = this.StartY + (this.MaxDatas - value) * unitPx
      var item = {
        value: value,
        yPosition: yPosition
      }
      this.YPoints.push(item)
    }
  }

  this.Draw = function () {
    // 绘制Y轴
    this.Canvas.beginPath()
    this.Canvas.strokeStyle = '#333333'
    this.Canvas.lineWidth = 1
    this.Canvas.moveTo(ToFixedPoint(this.StartX), ToFixedPoint(this.StartY))
    this.Canvas.lineTo(ToFixedPoint(this.StartX), ToFixedPoint(this.EndY))
    this.Canvas.font = '12px sans-serif'
    this.Canvas.fillStyle = '#333'
    for (var i in this.YPoints) {
      console.log('yAxis', this.YPoints[i])
      this.Canvas.moveTo(ToFixedPoint(this.StartX), ToFixedPoint(this.YPoints[i].yPosition))
      this.Canvas.lineTo(ToFixedPoint(this.StartX + 5), ToFixedPoint(this.YPoints[i].yPosition))
      this.Canvas.fillText((this.YPoints[i].value).toFixed(2), this.StartX + 10, this.YPoints[i].yPosition + 5)
    }
    this.Canvas.closePath()
    this.Canvas.stroke()

    this.Canvas.beginPath()
    this.Canvas.strokeStyle = '#d5e2e6'
    this.Canvas.lineWidth = 1
    for (var j in this.YPoints) {
      this.Canvas.moveTo(0, ToFixedPoint(this.YPoints[j].yPosition))
      this.Canvas.lineTo(this.StartX, ToFixedPoint(this.YPoints[j].yPosition))
    }
    this.Canvas.closePath()
    this.Canvas.stroke()
  }

  this.SetUpdateYAxis = function (option) {
    this.StartX = option.cEndX - Basic.yAxisWidth
    this.StartY = option.cStartY + Basic.curMsgContainerHeight
    this.EndX = option.cEndX
    this.EndY = option.cEndY - Basic.chartPd
    this.Datas = option.datas
    console.log('update yaxis:', this.StartX, this.StartY, this.EndX, this.EndY, this.Datas)
    // this.Canvas.clearRect(this.StartX, this.StartY, Basic.yAxisWidth, this.EndY - this.StartY)
    this.SetValueRange()
    this.Draw()
  }
}

function XAxis (canvas, option) {
  this.Canvas = canvas
  this.StartX = 0
  this.StartY = Basic.height - Basic.xAxisHeight
  this.EndX = option.cEndX - Basic.yAxisWidth
  this.EndY = Basic.height
  this.Datas = option.datas
  this.XPoints = []

  this.Create = function () {
    this.SetValueRange()
    this.Draw()
  }

  this.SetValueRange = function () {
    this.XPoints = []
    var spaceTime = parseInt((this.EndX - Basic.canvasPaddingLeft) / (Basic.kLineWidth + Basic.kLineMarginRight) / 4)
    for (let i = 1, j = parseInt(this.Datas.length / spaceTime); i <= j; i++) {
      var item = {}
      item.value = this.Datas[i * spaceTime - 1].day
      item.xPosition = Basic.canvasPaddingLeft + (Basic.kLineWidth + Basic.kLineMarginRight) * i * spaceTime - Basic.kLineMarginRight - Basic.kLineWidth / 2
      this.XPoints.push(item)
    }
  }

  this.Draw = function () {
    // 绘制X轴
    this.Canvas.beginPath()
    this.Canvas.strokeStyle = '#000'
    this.Canvas.lineWidth = 1
    this.Canvas.moveTo(ToFixedPoint(this.StartX), ToFixedPoint(this.StartY))
    this.Canvas.lineTo(ToFixedPoint(this.EndX), ToFixedPoint(this.StartY))
    this.Canvas.font = '12px sans-serif'
    this.Canvas.fillStyle = '#333'
    for (var i = 0, j = this.XPoints.length; i < j; i++) {
      this.Canvas.moveTo(ToFixedPoint(this.XPoints[i].xPosition), ToFixedPoint(this.StartY))
      this.Canvas.lineTo(ToFixedPoint(this.XPoints[i].xPosition), ToFixedPoint(this.StartY + 5))
      this.Canvas.fillText(this.XPoints[i].value, this.XPoints[i].xPosition - this.Canvas.measureText(this.XPoints[i].value).width / 2, this.StartY + 20)
    }
    this.Canvas.stroke()
    this.Canvas.closePath()

    this.Canvas.beginPath()
    this.Canvas.strokeStyle = '#d5e2e6'
    this.Canvas.lineWidth = 1
    for (var j in this.XPoints) {
      this.Canvas.moveTo(ToFixedPoint(this.XPoints[j].xPosition), 0)
      this.Canvas.lineTo(ToFixedPoint(this.XPoints[j].xPosition), this.StartY)
    }
    this.Canvas.closePath()
    this.Canvas.stroke()
  }

  this.SetUpdateXAxis = function (option) {
    console.log('update index: x')
    this.StartX = 0
    this.StartY = Basic.height - Basic.xAxisHeight
    this.EndX = option.cEndX - Basic.yAxisWidth
    this.EndY = Basic.height
    // this.Canvas.clearRect(this.StartX, this.StartY, this.EndX - this.StartX, this.EndY - this.StartY)
    this.Datas = option.datas
    this.SetValueRange()
    this.Draw()
  }
}

QTChart.Init = function (divElement) {
  var qtchart = new QTChart(divElement)
  return qtchart
}

function GetDevicePixelRatio () {
  if (typeof (window) == 'undefined') return 1;
  return window.devicePixelRatio || 1;
}

function Guid () {
  function S4 () {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  }
  return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}

//修正线段有毛刺
function ToFixedPoint (value) {
  return parseInt(value) + 0.5;
}

function ToFixedRect (value) {
  var rounded;
  return rounded = (0.5 + value) << 0;
}


/**
 * @desc 排序
 * @param {排序的key} field
 */
function sortBy (field) {
  return (x, y) => {
    return x[field] - y[field]
  }
}

function GetMyBrowser () {
  var userAgent = navigator.userAgent // 取得浏览器的userAgent字符串
  var isOpera = userAgent.indexOf('Opera') > -1
  if (isOpera) {
    return 'Opera'
  }; // 判断是否Opera浏览器
  if (userAgent.indexOf('Firefox') > -1) {
    return 'FF'
  } // 判断是否Firefox浏览器
  if (userAgent.indexOf('Chrome') > -1) {
    return 'Chrome'
  }
  if (userAgent.indexOf('Safari') > -1) {
    return 'Safari'
  } // 判断是否Safari浏览器
  if (userAgent.indexOf('compatible') > -1 && userAgent.indexOf('MSIE') > -1 && !isOpera) {
    return 'IE'
  }; // 判断是否IE浏览器
}