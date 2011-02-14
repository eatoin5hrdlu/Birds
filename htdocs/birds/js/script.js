/* Author: 

*/

/** Configuration vars **/
/* Timer length: Amount of time (in seconds) to give the user to observe the birds */
var timerLength = 1;
/* Calculation delay: amount of time (in seconds) to show the 'calculating' screen */
var calculationDelay = 1;
/* Reset timeout: the amount of time (in seconds) to wait for input before resetting to the initial screen */
var resetTimeoutDelay = 120;
/* Questions: the questions that are to be asked, at random */
/* Questions can have any of the three keywords '%highest', '%lowest', '%avg' */
var questions = [
	'Which behavior did you observe most often?',
	'Which behavior did you observe least often?',
	'Which behavior was the greatest percentage of your observations?',
	'Which behavior was the lowest percentage of your observations?',
	'How many more times were the birds %highest than %lowest?',
	'How did %highest compare to %lowest?',
	'How did %avg compare to %highest?',
	'How did %avg compare to %lowest?'
];

var activePagerColor = '#000';
var inactivePagerColor = '#888';
var textColor = '#000';
var timerTextSize = 700;
var labelTextSize = 20;
var fontName = 'Trebuchet MS';

function spinner(r, R1, R2, count, stroke_width, colour) {
    var sectorsCount = count || 12,
        color = colour || "#FFF",
        width = stroke_width || 15,
        r1 = Math.min(R1, R2) || 35,
        r2 = Math.max(R1, R2) || 60,
        cx = 640,
        cy = 420,
        
        sectors = [],
        opacity = [],
        beta = 2 * Math.PI / sectorsCount,

        pathParams = {stroke: color, "stroke-width": width, "stroke-linecap": "round"};
        Raphael.getColor.reset();
    for (var i = 0; i < sectorsCount; i++) {
        var alpha = beta * i - Math.PI / 2,
            cos = Math.cos(alpha),
            sin = Math.sin(alpha);
        opacity[i] = 1 / sectorsCount * i;
        sectors[i] = r.path([["M", cx + r1 * cos, cy + r1 * sin], ["L", cx + r2 * cos, cy + r2 * sin]]).attr(pathParams);
        if (color == "rainbow") {
            sectors[i].attr("stroke", Raphael.getColor());
        }
    }
    var tick;
    (function ticker() {
        opacity.unshift(opacity.pop());
        for (var i = 0; i < sectorsCount; i++) {
            sectors[i].attr("opacity", opacity[i]);
        }
        r.safari();
        tick = setTimeout(ticker, 1000 / sectorsCount);
    })();
    return function () {
        clearTimeout(tick);
        r.remove();
    };
}

jQuery(function(){
	function d(){
		if(typeof(console) !== 'undefined' && console != null && console.debug){
			console.debug.apply(console, arguments);
		}
	}

	var currentCardId = 'start';
	function showCard(cardId){
		if(currentCardId != cardId){
			jQuery('#'+currentCardId).css('z-index', 20).animate({
				'opacity': 0
			}, function(){
				// Move it to the back
				jQuery(this).css({
					'z-index': 0
				});
			});
			jQuery('#'+cardId).css({
				'opacity': 1,
				'z-index': 10
			});
			currentCardId = cardId;
		}
	}
	
	function _formatTimer(time){
		var timeString = ''+time;
		while(timeString.length < 2){
			timeString = '0'+timeString;
		}
		return timeString;
	}

	/**
		States:
			0 = Waiting for input, showing initial prompt
			1 = First button push, starting the timer
			2 = Timer done, 'Calculating'
			3 = Calculating done, pulling results
			4 = Viewing results
			5 = Bar Graph results
			6 = Pie Chart results
			7 = Question
	**/
	var _currentState = 0,
		_currentData = null,
		_totalObservations = 0,
		_paddingLeft = 120,
		_spinner = null,
		_lastQuestionIndex = null,
		_secondLastQuestionIndex = null,
		_firstRun = true,
		__results = null,
		__barGraph = null,
		__pieChart = null,
		__bubbleChart = null,
		__question = null,
		_colors = ['#8CD600', '#009EA0', '#F77F00', '#C13828', '#005B99'],
		labels = ['Eating', 'Stretching', 'Preening', 'Flapping', 'Sleeping'];
	function changeState(_state){
		resetTimeout();
		_currentState = _state;
		switch(_state){
			case 0:
				// Show the initial screen
				showCard('start');
				jQuery('#start').empty();
				var r = Raphael('start', 1280, 1024);
				var clockAttrs = {
					'stroke-width': 12,
					'stroke-linecap': 'round'
				};
				r.circle(640, 420, 230).attr(clockAttrs);
				r.circle(640, 420, 20).attr(clockAttrs);
				var date = new Date();
                var alpha = 360 / 12 * date.getHours(),
					a = (90 - alpha) * Math.PI / 180,
					x1 = 640 + 20 * Math.cos(a),
					y1 = 420 - 20 * Math.sin(a),
					x2 = 640 + 120 * Math.cos(a),
					y2 = 420 - 120 * Math.sin(a);
				r.path("M"+x1+" "+y1+"L"+x2+" "+y2).attr(clockAttrs);
				/*
				// Tick marks on clock
				for(var i=0; i<12; i++){
					var inner = 190;
//					if(i%3){
//						inner = 190;
//					}
					alpha = 360 / 12 * i;
					a = (90 - alpha) * Math.PI / 180;
					x1 = 640 + inner * Math.cos(a);
					y1 = 420 - inner * Math.sin(a);
					x2 = 640 + 200 * Math.cos(a);
					y2 = 420 - 200 * Math.sin(a);
					r.path("M"+x1+" "+y1+"L"+x2+" "+y2).attr(clockAttrs);
				}
				//*/
                var alpha = 360 / 60 * date.getMinutes(),
					a = (90 - alpha) * Math.PI / 180,
					x1 = 640 + 20 * Math.cos(a),
					y1 = 420 - 20 * Math.sin(a),
					x2 = 640 + 200 * Math.cos(a),
					y2 = 420 - 200 * Math.sin(a);
				r.path("M"+x1+" "+y1+"L"+x2+" "+y2).attr(clockAttrs);
				r.print(185, 725, "Press the white button to start the timer.", r.getFont(fontName), 50).attr(txtAttrs);
				break;
			case 1:
				showCard('timer');
				jQuery('#timer-display').empty();
				var r = Raphael('timer-display', 1280, 1024);
				var currentTime = timerLength;
				var txtAttrs = {
					fill: textColor
				};
				var txt = r.print(280, 500, _formatTimer(currentTime--), r.getFont(fontName), timerTextSize).attr(txtAttrs);
				var interval = window.setInterval(function(){
					if(currentTime < 0){
						window.clearInterval(interval);
						changeState(2);
					}else{
						r.clear();
						txt = r.print(280, 500, _formatTimer(currentTime--), r.getFont(fontName), timerTextSize).attr(txtAttrs);
					}
				}, 1000);
				break;
			case 2:
				showCard('calculating');
				// Initialize the spinner (for the calculating page)
				var r = Raphael('calculating-spinner', 1280, 1024);
				r.print(385, 800, "Calculating your data...", r.getFont(fontName), 50).attr(txtAttrs);
				_spinner = spinner(r, 150, 250, 18, 40, activePagerColor);
				var timeout = window.setTimeout(function(){
					changeState(3);
				}, calculationDelay*1000);
				break;
			case 3:	
				jQuery.getJSON('vars.js?time='+(new Date()).getTime(), function(data, textStatus, xhr){
					_currentData = data;
					_totalObservations = 0;
					for(var i=0; i<_currentData.length; i++){
						_totalObservations += _currentData[i];
					}
					jQuery('h1.heading').html('You observed <span>'+_totalObservations+'</span> bird behaviors.');
					
					// Setup magnet chart
					if(__results == null){
						/* Create the results visualization */
						__results = Raphael('results-magnets', 1200, 830);
						// Create the vertical lines
						for(var i=1; i<5; i++){
							__results.rect(i*210 + _paddingLeft, 100, 1, 750);
						}
						// Create the labels
						for(var i=0; i<5; i++){
							var txt = __results.print(i*210 + _paddingLeft + 50, 100 + (labelTextSize*1.5)/2, labels[i], __results.getFont(fontName), labelTextSize*1.5).attr({fill: textColor});
						}
						// Foreach action
						for(var i=0; i<5; i++){
							// Foreach observation in the data for that action
							for(var j=0; j<_currentData[i]; j++){
								// Add a dot
								var x = i*210 + _paddingLeft + 55;
								if(j%2){
									x += 100;
								}
								var y = 750;
								y -= Math.floor(j/2)*100;
								var dot = __results.circle(x, y, 40).attr({fill: '#000'});
							}
						}
					}
					// Setup bar chart
					var barColors = []
					if(__barGraph == null){
						/* Create the bar graph */
						// Convert the data
						var barData = [_currentData];
						
						// Max data point
						var max = 0;
						for(var i=0; i<_currentData.length; i++){
							if(_currentData[i] > max){
								max = _currentData[i];
							}
						}
						
						// Figure out color mapping
						var cm = [];
						for(var i=0; i<_currentData.length; i++){
							var j = 0;
							var value = _currentData[i];
							for(j=0; j<cm.length; j++){
								if(value > cm[j].value){
									break;
								}
							}
							cm.splice(j, 0, {'value': value, 'color': _colors[i]});
						}
						for(var i=0; i<cm.length; i++){
							barColors.push(cm[i].color);
						}
						/*
						var colorMap = {};
						var colorMapIndices = [];
						for(var i=0; i<_colors.length; i++){
							colorMap[_currentData[i]] = _colors[i];
							colorMapIndices.push(_currentData[i]);
						}
						colorMapIndices.sort(function sortmyway(a, b){
							if(a<b) return 1;
							if(a>b) return -1;
							return 0;
						});
						for(var i=0; i<colorMapIndices.length; i++){
							barColors.push(colorMap[colorMapIndices[i]]);
						}
						//*/
						
						var bgHeight = 670;
						var bgWidth = 1100;
						var interval = bgHeight/(max+1);
						var yPadding = 20;
						var xPadding = 70;
						var gutter = 90;
						
						__barGraph = Raphael('bar-graph-actual', bgWidth+20, bgHeight+60);
						// Y-axis
						__barGraph.rect(xPadding+70, 0+yPadding, 1, bgHeight).attr({fill: '#C0C0C0', stroke: '#C0C0C0'});
						__barGraph.print(xPadding+10, bgHeight-50+yPadding, 'Number of Behaviors Counted', __barGraph.getFont(fontName), 25).rotate(270, xPadding+10, bgHeight-50+yPadding).attr({fill: '#C0C0C0'});
						// Y-axis ticks & lines
						for(var i=0; i<(max+2); i++){
							if(i != max+1){
								// Create a line
								__barGraph.rect(xPadding+71, i*interval+yPadding, 1210, 2).attr({fill: '#F4F4F4', stroke: '#F4F4F4'});
								// Create a tick
								__barGraph.rect(xPadding+68, i*interval+yPadding, 7, 1).attr({fill: '#C0C0C0', stroke: '#C0C0C0'});
							}
							// Create a label
							__barGraph.print(xPadding+45-((''+(max-i+1)).length > 1?14:0), i*interval+yPadding+2, max-i+1, __barGraph.getFont(fontName), 25).attr({fill: textColor});
						}
	
						// X-axis
						__barGraph.rect(xPadding+70, bgHeight+yPadding, 1210, 1).attr({fill: '#C0C0C0', stroke: '#C0C0C0'});
						var barWidth = (bgWidth - ((_currentData.length+1)*gutter) - 20) / _currentData.length;
						for(var i=0; i<_currentData.length; i++){
							var label = __barGraph.print(xPadding+80+(gutter/2)+(i*barWidth)+(i*gutter)+(barWidth/2), bgHeight+yPadding+labelTextSize, labels[i], __barGraph.getFont(fontName), labelTextSize*1.5).attr({fill: textColor});
							var bbox = label.getBBox();
							label.translate(-(bbox.width/2), 0);
							
//							__barGraph.print(xPadding+40+(i*barWidth)+((i+1)*gutter), bgHeight+interval+yPadding+labelTextSize, labels[i], __barGraph.getFont(fontName), labelTextSize*1.5).attr({fill: textColor});
						}
	
						var graph = __barGraph.g.barchart(xPadding+30, interval+yPadding, bgWidth, bgHeight-interval, barData, {'gutter': gutter, 'vgutter': 0, 'type': 'square', 'colors': ['#000']});
						var barNum = 0;
						jQuery(graph.bars).each(function(){
							jQuery(this).each(function(idx, bar){
								bar.attr({fill: _colors[barNum++]});
							});
						});
					}
					// Setup pie chart
					if(__pieChart == null){
						/* Create the pie chart */
						__pieChart = Raphael('pie-chart-actual', 1280, 900);
						__pieChart.g.txtattr.font = "40px 'Fontin Sans', Fontin-Sans, sans-serif";
						var radius =  300;
						var pieData = [];
						var pieLabels = [];
						var pieColors = [];
						var count = 0;
						for(var i=0; i<_currentData.length; i++){
							if(_currentData[i] > 0){
								pieColors.push(barColors[count++]);
								pieData.push(_currentData[i]);
								pieLabels.push(labels[i]);
							}
						}
						__pieChart.g.colors = pieColors;
						var pc = __pieChart.g.piechart(640, 400, radius, pieData, {'labels': pieLabels, 'colors': pieColors});
						pc.each(function(){
							if(this.value.value){
								var labelX = (((this.x - this.cx)*2)/radius) * (radius+50)+this.cx;
								var labelY = (((this.y - this.cy)*2)/radius) * (radius+50)+this.cy;
								var bigLabel = __pieChart.print(labelX, labelY, Math.round((this.value.value/_totalObservations)*100)+'% '+pieLabels[this.value.order], __pieChart.getFont(fontName), labelTextSize*1.5).attr({fill: textColor});
								var bigLabelBBox = bigLabel.getBBox();
								var bdx = -(bigLabelBBox.width/2);
								if((((this.x - this.cx)*2)/radius) > 0.70){
									bdx = 0;
								}else if((((this.x - this.cx)*2)/radius) < -0.70){
									bdx = -bigLabelBBox.width;
								}
								var bdy = -(bigLabelBBox.height/2)
								bigLabel.translate(bdx, bdy);
	
								var smallLabel = __pieChart.print(labelX, labelY+labelTextSize, this.value.value+' Behavior'+(this.value.value>1?'s':''), __pieChart.getFont(fontName), labelTextSize).attr({fill: textColor});
								var smallLabelBBox = smallLabel.getBBox();
								var dx = -(smallLabelBBox.width/2);
								if((((this.x - this.cx)*2)/radius) > 0.70){
									dx = 0;
								}else if((((this.x - this.cx)*2)/radius) < -0.70){
									dx = -smallLabelBBox.width;
								}
								smallLabel.translate(dx, -(smallLabelBBox.height/2));
								
								if(pieData.length > 1){
									// Line
									if((((this.y - this.cy)*2)/radius) > 0.70){
										bdy = -labelTextSize-10;
									}else if((((this.y - this.cy)*2)/radius) < -0.70){
										bdy = bigLabelBBox.height;
									}
									if((((this.x - this.cx)*2)/radius) > 0.70){
										bdx = -10;
									}else if((((this.x - this.cx)*2)/radius) < -0.70){
										bdx = 10;
									}else{
										bdx = 0;
									}
									var lineX = (((this.x - this.cx)*2)/radius) * (radius-30)+this.cx;
									var lineY = (((this.y - this.cy)*2)/radius) * (radius-30)+this.cy;
									var pathParams = {stroke: '#000', "stroke-width": 2, "stroke-linecap": "round"};
									__pieChart.path([["M", labelX+bdx, labelY+bdy], ["L", lineX, lineY]]).attr(pathParams);
								}
							}
						});
					}
					if(__bubbleChart == null){
						// Setup bubble chart
						__bubbleChart = Raphael('bubble-chart-actual', 1280, 900);
						
						var bubblePadding = 10;
						var minX = 100-(4*bubblePadding);
						var minY = 100;
						var width = 1080;
						var height = 600;
						var maxX = 1180;
						var maxY = 700;
						var maxR = 300;

						var total = 0;
						var totalArea = 0;
						var minSize = 1000;
						var maxSize = 0;
						for(var i=0; i<_currentData.length; i++){
							total += _currentData[i];
							if(_currentData[i] < minSize){
								minSize = _currentData[i];
							}
							if(_currentData[i] > maxSize){
								maxSize = _currentData[i];
							}
						}

						var circles = {};
						/*
						var colors = {};
						var colorMapIndices = [];
						for(var i=0; i<_currentData.length; i++){
							colors[_currentData[i]] = {'value': _currentData[i], 'color': _colors[i], 'label': labels[i]};
							colorMapIndices.push(_currentData[i]);
						}
						colorMapIndices.sort(function sortmyway(a, b){
							if(a<b) return 1;
							if(a>b) return -1;
							return 0;
						});
						//*/
						// Figure out color mapping
						var cm = [];
						for(var i=0; i<_currentData.length; i++){
							var j = 0;
							var value = _currentData[i];
							for(j=0; j<cm.length; j++){
								if(value > cm[j].value){
									break;
								}
							}
							cm.splice(j, 0, {'value': value, 'color': _colors[i], 'label': labels[i]});
						}
						var circleSet = __bubbleChart.set();
						for(var i=0; i<_currentData.length; i++){
//							var value = _currentData[i];
//							var item = colors[_currentData[i]];
							var item = cm[i];
							if(item.value > 0){
								var r = Math.ceil(item.value*width/(2*total));
								if(r > maxR){
									r = maxR;
								}
								// Determine an appropriate random location for the circle
								var myX = minX+r+(i*bubblePadding);
								minX += 2*r;
								var myY = 350;
	
								circles[i] = {
									'radius': r,
									'path': __bubbleChart.circle(myX, myY, r).attr({
										'fill': item.color,
	//									'fill-opacity': .5,
	//									'stroke-opacity': .5,
										'stroke': item.color
									}),
									'text': __bubbleChart.print(myX, myY+r+10+(labelTextSize*1.5)/2, item.label, __results.getFont(fontName), labelTextSize*1.5).attr({
										fill: textColor
									})
								};
								var bbox = circles[i].text.getBBox();
								circles[i].text.translate(-(bbox.width/2), 0);
								
								circleSet.push(circles[i].path).push(circles[i].text);
							}
						}
						
					}

					// Done calculating, so change state!
					changeState(4); // Default state after calculating
					if(_spinner){
						_spinner(); // Remove the spinner
					}
				});
				break;
			case 4:
				showCard('results');
				break;
			case 5:
				showCard('bar-graph');
				break;
			case 6:
				showCard('pie-chart');
				break;
			case 7:
				showCard('bubble-chart');
				break;
			case 8:
				showCard('question');
				if(__question == null){
					// Select a question from those that are available
					var idx = Math.floor(Math.random()*questions.length);
					while(idx == _lastQuestionIndex || (questions.length > 2 && idx == _secondLastQuestionIndex)){
						idx = Math.floor(Math.random()*questions.length);
					}
					__question = questions[idx];
					// Max data point
					var max = 0;
					var maxLabel = '';
					for(var i=0; i<_currentData.length; i++){
						if(_currentData[i] > max){
							max = _currentData[i];
							maxLabel = labels[i];
						}
					}
					// Min data point
					var min = 1000;
					var minLabel = '';
					for(var i=0; i<_currentData.length; i++){
						if(_currentData[i] < min){
							min = _currentData[i];
							minLabel = labels[i];
						}
					}
					// Middle data point
					var avg = 0;
					for(var i=0; i<_currentData.length; i++){
						avg += _currentData[i];
					}
					avg /= _currentData.length;

					var diff = 1000;
					var diffLabel = '';
					for(var i=0; i<_currentData.length; i++){
						var thisDiff = Math.abs(avg-_currentData[i]);
						if(thisDiff < diff){
							// This item is closer than the last
							diff = thisDiff;
							diffLabel = labels[i];
						}
					}
					
					while(__question && (
						(minLabel == maxLabel && (__question.indexOf('%lowest') != -1 || __question.indexOf('%highest') != -1)) || 
						(minLabel == diffLabel && (__question.indexOf('%lowest') != -1 || __question.indexOf('%avg') != -1)) || 
						(maxLabel == diffLabel && (__question.indexOf('%highest') != -1 || __question.indexOf('%avg') != -1))
					)){
						if(++idx >= questions.length){
							idx = 0;
						}
						__question = questions[idx];
					}
					var highestIdx = __question.indexOf('%highest');
					var lowestIdx = __question.indexOf('%lowest');
					var avgIdx = __question.indexOf('%avg');
					// Do any transformation on the __question
					if(highestIdx != -1){
						__question = __question.replace('%highest', maxLabel);
					}
					if(lowestIdx != -1){
						__question = __question.replace('%lowest', minLabel);
					}
					if(avgIdx != -1){
						__question = __question.replace('%avg', diffLabel);
					}
					jQuery('#question-heading').html(__question);
					_secondLastQuestionIndex = _lastQuestionIndex;
					_lastQuestionIndex = idx;
				}
				break;
			default:
				d('something bad happened, aborting?');
				break;
		}
	}
	
	var _timeout = null;
	function reset(initialState){
		if(!initialState){
			initialState = 0;
		}
		// Reset the results, the bar graph, the pie chart, and go to the initial state
		jQuery('#results-magnets, #bar-graph-actual, #pie-chart-actual, #bubble-chart-actual, #start, h1.heading').empty();
		_firstRun = true;
		__results = null;
		__barGraph = null;
		__pieChart = null;
		__bubbleChart = null;
		__question = null;
		changeState(initialState);
	}
	function resetTimeout(){
		// If no input or state change within 2 minutes, timeout and reset
		if(_timeout){
			window.clearTimeout(_timeout);
		}
		_timeout = window.setTimeout(function(){
			// Reload the page, that's easier
			//window.location.reload(false);
			// This doesn't work if we want to save state for what the last question was that was asked

			reset(0);
			//*/
		}, (resetTimeoutDelay*1000));
	}
	
	jQuery(document).keyup(function(e){
		resetTimeout();
		// Do different things based on the current state
		switch(_currentState){
			case 4:
			case 5:
			case 6:
			case 7:
			case 8:
				if(e.keyCode == 39){
					// Right arrow
					_firstRun = false;
					if(_currentState == 8){
						changeState(4);
					}else{
						changeState(_currentState+1);
					}
				}else if(e.keyCode == 37){
					// Left arrow
					if(_currentState == 4){
						if(_firstRun != true){
							changeState(8);
						}
					}else{
						changeState(_currentState-1);
					}
				}else if(e.keyCode == 13){
					// Enter
					reset(1);
				}
				break;
			case 0:
				// Respond to 13 (Enter)
				if(e.keyCode == 13){
					changeState(1);
//				}else if(e.keyCode == 39){ // For debugging, allows skipping from the initial screen straight to results
//					changeState(3);
				}
			default:
				break;
		}
	});
	
	/* Initialize initial state */
	// Hide all cards
	jQuery('.card').css('z-index', 0);
	jQuery('#start').css('z-index', 10);
	// changeState to 0
	changeState(0);
	
	// Initialize the pager indicators on results, bar-graph, and pie-chart
	function createPager(containerId, activeIndex){
		var i = 0;
		return Raphael([containerId, 100, 20,{
			'type': 'circle',
			'cx': 10,
			'cy': 10,
			'r': 5,
			'stroke': i == activeIndex ? activePagerColor : inactivePagerColor,
			'fill': i++ == activeIndex ? activePagerColor : inactivePagerColor
		},{
			'type': 'circle',
			'cx': 30,
			'cy': 10,
			'r': 5,
			'stroke': i == activeIndex ? activePagerColor : inactivePagerColor,
			'fill': i++ == activeIndex ? activePagerColor : inactivePagerColor
		},{
			'type': 'circle',
			'cx': 50,
			'cy': 10,
			'r': 5,
			'stroke': i == activeIndex ? activePagerColor : inactivePagerColor,
			'fill': i++ == activeIndex ? activePagerColor : inactivePagerColor
		},{
			'type': 'circle',
			'cx': 70,
			'cy': 10,
			'r': 5,
			'stroke': i == activeIndex ? activePagerColor : inactivePagerColor,
			'fill': i++ == activeIndex ? activePagerColor : inactivePagerColor
		},{
			'type': 'text',
			'x': 90,
			'y': 10,
			'text': '?',
			'fill': i++ == activeIndex ? activePagerColor : inactivePagerColor,
//			'font-weight': 'bold',
			'font-size': 14
		}]);
	}
	var resultsPager = createPager('results-pager', 0);
	var barGraphPager = createPager('bar-graph-pager', 1);
	var pieChartPager = createPager('pie-chart-pager', 2);
	var bubbleChartPager = createPager('bubble-chart-pager', 3);
	var questionPager = createPager('question-pager', 4);
});

/*!
 * The following copyright notice may not be removed under any circumstances.
 * 
 * Copyright:
 * Digitized data © 2007 Ascender Corporation. All rights reserved.
 * 
 * Trademark:
 * Liberation is a trademark of Red Hat, Inc. registered in U.S. Patent and
 * Trademark Office and certain other jurisdictions.
 * 
 * Manufacturer:
 * Ascender Corporation
 * 
 * Designer:
 * Steve Matteson
 * 
 * Vendor URL:
 * http://www.ascendercorp.com/
 * 
 * License information:
 * http://www.ascendercorp.com/liberation.html
 */
Raphael.registerFont({"w":1229,"face":{"font-family":"Liberation Mono","font-weight":400,"font-stretch":"normal","units-per-em":"2048","panose-1":"2 7 3 9 2 2 5 2 4 4","ascent":"1638","descent":"-410","x-height":"20","bbox":"-5 -1484 1233 427.148","underline-thickness":"84","underline-position":"-435","unicode-range":"U+0020-U+007E"},"glyphs":{" ":{},"\u00a0":{},"!":{"d":"689,-397r-148,0r-24,-951r196,0xm515,0r0,-201r194,0r0,201r-194,0"},"\"":{"d":"908,-845r-142,0r-40,-639r224,0xm459,-845r-141,0r-41,-639r224,0"},"#":{"d":"930,-833r-67,317r260,0r0,108r-283,0r-88,408r-110,0r86,-408r-363,0r-84,408r-110,0r84,-408r-201,0r0,-108r225,0r67,-317r-241,0r0,-108r263,0r89,-408r110,0r-88,408r363,0r88,-408r110,0r-88,408r211,0r0,108r-233,0xm459,-833r-69,317r362,0r67,-317r-360,0"},"$":{"d":"686,-787v233,57,464,118,464,407v0,257,-202,346,-464,360r0,161r-128,0r0,-161v-278,-7,-443,-129,-492,-359r170,-37v32,160,136,250,322,258r0,-489v-213,-54,-428,-110,-428,-376v0,-239,192,-312,428,-323r0,-130r128,0r0,130v252,6,384,114,433,321r-174,33v-27,-133,-107,-212,-259,-221r0,426xm558,-1215v-146,7,-256,54,-256,197v0,156,131,181,256,216r0,-413xm686,-156v160,-12,292,-63,292,-227v0,-177,-151,-205,-292,-244r0,471"},"%":{"d":"221,0r-145,0r932,-1353r147,0xm0,-1025v0,-215,84,-336,291,-336v202,0,284,125,283,336v0,212,-85,341,-287,341v-203,0,-287,-129,-287,-341xm289,-797v117,0,138,-103,138,-228v0,-126,-17,-228,-137,-228v-123,0,-143,99,-143,228v0,127,21,228,142,228xm656,-329v0,-215,84,-336,291,-336v202,0,284,125,283,336v0,212,-85,341,-287,341v-203,0,-287,-129,-287,-341xm945,-101v117,0,138,-103,138,-228v0,-126,-17,-228,-137,-228v-123,0,-143,99,-143,228v0,127,21,228,142,228"},"&":{"d":"1185,-10v-31,14,-68,22,-113,22v-123,0,-203,-62,-264,-129v-83,74,-190,137,-347,137v-261,0,-418,-125,-418,-378v0,-228,139,-336,292,-419v-39,-77,-75,-169,-75,-282v0,-202,140,-298,351,-298v187,0,321,83,321,267v0,171,-134,237,-256,300v-48,25,-99,46,-151,68r62,104v64,103,135,197,215,285v58,-121,99,-249,125,-406r145,43v-32,177,-94,329,-162,462v55,78,162,133,275,89r0,135xm608,-1236v-120,0,-197,61,-200,180v-2,86,32,168,61,224v104,-47,227,-84,287,-170v16,-24,24,-52,24,-83v-3,-101,-70,-151,-172,-151xm211,-362v-2,184,143,284,333,242v68,-15,121,-54,162,-97v-117,-131,-227,-285,-316,-441v-103,56,-178,148,-179,296"},"'":{"d":"684,-845r-141,0r-41,-639r224,0"},"(":{"d":"891,-1484v-202,253,-362,514,-362,954v0,441,160,702,362,955r-190,0v-202,-251,-359,-515,-359,-957v0,-441,157,-702,359,-952r190,0"},")":{"d":"528,-1484v202,249,357,511,357,952v0,442,-155,707,-357,957r-192,0v203,-253,364,-514,364,-955v0,-440,-162,-702,-364,-954r192,0"},"*":{"d":"671,-1188r264,-103r45,132r-282,73r185,250r-119,72r-150,-258r-156,256r-119,-72r189,-248r-280,-73r45,-134r267,107r-12,-297r136,0"},"+":{"d":"687,-608r0,428r-147,0r0,-428r-424,0r0,-146r424,0r0,-428r147,0r0,428r424,0r0,146r-424,0"},",":{"d":"259,363r169,-662r265,0r-311,662r-123,0"},"-":{"d":"334,-464r0,-160r560,0r0,160r-560,0"},"\u00ad":{"d":"334,-464r0,-160r560,0r0,160r-560,0"},".":{"d":"496,0r0,-299r235,0r0,299r-235,0"},"\/":{"d":"114,20r821,-1504r178,0r-817,1504r-182,0"},"0":{"d":"1065,-1013v48,166,49,498,-1,665v-65,218,-191,368,-453,368v-376,0,-484,-297,-487,-695v-1,-245,45,-423,141,-551v102,-135,345,-182,541,-112v136,49,213,166,259,325xm741,-155v199,-93,203,-507,159,-785v-27,-169,-97,-284,-283,-284v-280,0,-308,253,-311,549v-2,181,19,325,80,428v46,77,115,118,227,120v47,0,90,-9,128,-28"},"1":{"d":"148,-1120v215,-6,381,-89,463,-229r166,0r0,1204r353,0r0,145r-973,0r0,-145r439,0r0,-1021v-76,124,-256,185,-448,194r0,-148"},"2":{"d":"611,-1370v266,0,451,107,451,368v0,145,-77,243,-154,327v-132,143,-316,255,-451,395v-43,43,-75,87,-96,134r723,0r0,146r-940,0r0,-117v123,-264,388,-412,582,-603v73,-72,151,-148,151,-271v0,-161,-104,-231,-266,-231v-162,0,-249,90,-268,238r-184,-17v34,-232,185,-369,452,-369"},"3":{"d":"1060,-1016v0,191,-128,286,-295,323r0,4v154,17,262,92,313,209v14,35,21,72,21,110v0,276,-194,390,-478,390v-293,0,-458,-130,-493,-382r186,-17v24,160,121,250,307,250v173,1,297,-80,291,-247v-7,-208,-221,-239,-446,-233r0,-156v170,8,314,-21,380,-125v19,-30,29,-65,29,-107v-2,-151,-101,-225,-264,-225v-159,0,-264,88,-278,233r-181,-14v32,-239,197,-367,461,-367v265,0,447,103,447,354"},"4":{"d":"937,-319r0,319r-180,0r0,-319r-654,0r0,-140r635,-890r199,0r0,888r188,0r0,142r-188,0xm757,-1154r-500,693r500,0r0,-693"},"5":{"d":"353,-779v96,-85,326,-119,480,-58v155,62,266,186,266,393v0,304,-190,464,-500,464v-268,0,-424,-117,-471,-335r182,-21v36,129,124,212,293,209v197,-3,309,-115,309,-313v0,-181,-119,-279,-305,-282v-120,-2,-198,45,-262,101r-176,0r47,-728r801,0r0,145r-635,0"},"6":{"d":"330,-695v59,-113,178,-186,342,-186v207,0,335,103,394,256v41,106,39,256,0,365v-61,170,-197,280,-425,280v-367,0,-490,-287,-490,-662v0,-324,86,-569,293,-680v130,-70,350,-59,460,16v73,50,125,123,153,223r-172,31v-31,-108,-108,-172,-232,-172v-185,0,-262,139,-301,302v-15,66,-22,141,-22,227xm635,-125v186,0,273,-125,278,-313v6,-222,-164,-354,-383,-288v-102,31,-182,111,-182,245v0,156,65,271,168,327v35,19,75,29,119,29"},"7":{"d":"1069,-1210v-179,261,-350,547,-435,894v-25,105,-38,210,-38,316r-188,0v8,-383,152,-668,302,-925v57,-98,120,-190,185,-279r-737,0r0,-145r911,0r0,139"},"8":{"d":"809,-709v168,32,285,135,285,331v0,276,-191,398,-480,398v-288,0,-481,-121,-481,-396v0,-192,119,-297,281,-331r0,-4v-181,-36,-309,-239,-220,-443v61,-139,210,-216,416,-216v211,0,357,75,422,217v19,42,27,86,27,131v0,171,-101,275,-250,309r0,4xm612,-779v169,0,260,-74,260,-233v0,-157,-99,-224,-262,-224v-160,0,-260,69,-260,224v0,154,96,233,262,233xm616,-115v194,1,291,-91,291,-280v0,-171,-115,-249,-297,-249v-178,0,-291,86,-291,253v0,186,106,275,297,276"},"9":{"d":"909,-650v-58,120,-178,199,-350,199v-210,0,-332,-115,-389,-275v-40,-111,-40,-266,2,-374v64,-168,209,-270,438,-270v157,0,276,55,356,166v80,111,121,278,121,501v-1,324,-87,568,-297,677v-135,71,-366,57,-475,-22v-71,-52,-117,-126,-145,-226r172,-27v34,112,104,176,238,176v186,0,262,-137,304,-298v16,-65,24,-141,25,-227xm324,-911v-5,222,155,371,380,301v105,-33,187,-114,187,-252v0,-158,-59,-275,-163,-332v-36,-20,-77,-30,-124,-30v-187,0,-276,125,-280,313"},":":{"d":"496,0r0,-299r235,0r0,299r-235,0xm496,-783r0,-299r235,0r0,299r-235,0"},";":{"d":"496,-783r0,-299r235,0r0,299r-235,0xm352,363r169,-662r265,0r-311,662r-123,0"},"\u037e":{"d":"496,-783r0,-299r235,0r0,299r-235,0xm352,363r169,-662r265,0r-311,662r-123,0"},"<":{"d":"116,-571r0,-205r995,-418r0,154r-858,366r858,367r0,153"},"=":{"d":"116,-856r0,-148r995,0r0,148r-995,0xm116,-344r0,-148r995,0r0,148r-995,0"},">":{"d":"116,-154r0,-153r858,-367r-858,-366r0,-154r995,418r0,205"},"?":{"d":"94,-960v39,-259,205,-410,500,-410v214,0,372,69,445,210v58,112,30,292,-34,372v-102,128,-278,182,-353,334v-13,28,-20,60,-21,97r-175,0v9,-310,312,-328,416,-543v12,-28,19,-59,19,-94v0,-165,-127,-226,-295,-226v-189,0,-295,102,-318,272xm448,0r0,-201r195,0r0,201r-195,0"},"@":{"d":"1044,94v-115,96,-242,189,-450,189v-303,0,-446,-213,-512,-468v-89,-343,-18,-803,126,-1023v99,-151,237,-276,464,-276v291,0,429,206,486,450v73,310,31,729,-145,882v-38,32,-81,48,-129,48v-110,1,-154,-78,-141,-195r-6,0v-42,98,-103,195,-235,195v-277,0,-250,-452,-180,-679v39,-127,108,-239,217,-294v33,-16,68,-24,105,-24v117,1,160,79,184,173r5,0r32,-151r116,0r-127,667v-8,70,-37,198,37,206v73,-8,106,-78,129,-152v76,-239,65,-649,-56,-831v-64,-96,-149,-179,-294,-179v-185,0,-295,118,-370,250v-150,261,-186,830,-16,1096v67,105,165,187,320,187v172,0,274,-77,369,-158xm753,-595v27,-146,52,-404,-107,-404v-99,0,-139,90,-173,169v-58,137,-88,374,-37,540v13,43,39,80,90,80v117,0,154,-122,191,-226v17,-47,25,-101,36,-159"},"A":{"d":"1034,0r-138,-382r-563,0r-137,382r-196,0r510,-1349r217,0r501,1349r-194,0xm847,-531r-231,-674r-81,251r-151,423r463,0"},"B":{"d":"802,-711v201,24,350,118,350,331v0,285,-232,380,-518,380r-472,0r0,-1349v401,9,908,-73,908,327v0,183,-111,276,-268,311xm578,-780v175,-1,296,-51,300,-218v5,-236,-287,-194,-525,-198r0,416r225,0xm353,-153v281,-2,611,43,606,-244v-5,-271,-329,-232,-606,-234r0,478"},"C":{"d":"650,-1214v-281,0,-336,242,-336,533v0,296,60,546,347,546v188,0,264,-143,322,-282r159,65v-83,196,-207,372,-483,372v-401,0,-546,-295,-546,-701v0,-408,135,-689,536,-689v263,0,391,146,466,335r-168,65v-46,-128,-127,-244,-297,-244"},"D":{"d":"473,-1349v438,-1,655,220,652,661v-2,421,-181,680,-593,688r-370,0r0,-1349r311,0xm515,-156v306,-4,418,-204,418,-532v0,-331,-131,-508,-459,-505r-121,0r0,1037r162,0"},"E":{"d":"162,0r0,-1349r919,0r0,156r-728,0r0,422r668,0r0,154r-668,0r0,461r769,0r0,156r-960,0"},"F":{"d":"385,-1193r0,494r676,0r0,158r-676,0r0,541r-191,0r0,-1349r891,0r0,156r-700,0"},"G":{"d":"655,-135v107,-1,196,-34,260,-74r0,-336r-293,0r0,-160r479,0r0,572v-119,78,-263,153,-462,153v-291,0,-432,-181,-494,-420v-22,-85,-32,-179,-32,-281v1,-407,129,-689,529,-689v261,0,393,138,461,331r-171,56v-47,-132,-123,-231,-288,-231v-281,0,-330,243,-330,533v0,179,28,314,84,407v56,93,142,139,257,139"},"H":{"d":"875,0r0,-623r-522,0r0,623r-191,0r0,-1349r191,0r0,566r522,0r0,-566r191,0r0,1349r-191,0"},"I":{"d":"202,-1349r823,0r0,156r-316,0r0,1037r316,0r0,156r-823,0r0,-156r316,0r0,-1037r-316,0r0,-156"},"J":{"d":"587,-135v153,0,209,-114,209,-281r0,-777r-311,0r0,-156r501,0r0,929v-4,272,-129,440,-400,440v-253,0,-368,-136,-410,-370r187,-31v24,135,77,246,224,246"},"K":{"d":"1003,0r-487,-638r-163,169r0,469r-191,0r0,-1349r191,0r0,673r572,-673r225,0r-504,572r581,777r-224,0"},"L":{"d":"237,0r0,-1349r191,0r0,1193r672,0r0,156r-863,0"},"M":{"d":"937,0r1,-972r5,-197r-95,291r-164,438r-137,0r-193,-518r-69,-211r4,301r0,868r-160,0r0,-1349r237,0r185,489v25,67,48,156,68,231r70,-230r185,-490r225,0r0,1349r-162,0"},"N":{"d":"912,-211v-10,-84,-18,-177,-18,-274r0,-864r172,0r0,1349r-230,0r-520,-1130r14,170v2,30,2,58,2,84r0,876r-170,0r0,-1349r222,0"},"O":{"d":"615,-1370v367,0,513,281,511,689v-2,318,-88,555,-298,657v-63,31,-135,44,-215,44v-387,0,-511,-302,-511,-701v0,-400,126,-689,513,-689xm851,-275v95,-164,90,-648,-5,-807v-102,-170,-365,-169,-465,0v-95,161,-99,650,1,809v57,90,130,138,232,138v109,0,184,-49,237,-140"},"P":{"d":"622,-1349v296,3,497,118,497,404v0,206,-114,331,-271,395v-127,52,-321,32,-495,36r0,514r-191,0r0,-1349r460,0xm607,-665v195,-2,320,-89,320,-277v0,-183,-129,-255,-328,-254r-246,0r0,531r254,0"},"Q":{"d":"615,-1370v367,0,514,281,511,689v-2,353,-105,611,-380,685v48,144,112,235,276,240v36,1,85,-7,115,-13r0,134v-95,24,-238,34,-327,-3v-142,-58,-210,-190,-259,-346v-336,-40,-449,-320,-449,-697v0,-400,126,-689,513,-689xm851,-275v95,-164,90,-648,-5,-807v-102,-170,-365,-169,-465,0v-95,161,-99,650,1,809v57,90,130,138,232,138v109,0,184,-49,237,-140"},"R":{"d":"644,-1349v282,2,477,101,477,373v0,224,-142,342,-344,379r400,597r-220,0r-366,-575r-238,0r0,575r-191,0r0,-1349r482,0xm633,-726v182,-1,296,-74,296,-247v0,-149,-101,-223,-304,-223r-272,0r0,470r280,0"},"S":{"d":"614,-1226v-168,1,-283,54,-283,213v0,182,190,189,334,234r111,29v189,54,352,137,352,380v0,285,-218,388,-518,390v-302,2,-479,-118,-531,-358r185,-37v34,164,148,248,351,246v184,-1,324,-58,324,-238v0,-204,-208,-219,-372,-266r-101,-27v-172,-51,-321,-127,-321,-350v0,-266,201,-356,470,-360v280,-4,430,101,480,324r-188,33v-29,-141,-121,-215,-293,-213"},"T":{"d":"709,-1193r0,1193r-190,0r0,-1193r-443,0r0,-156r1076,0r0,156r-443,0"},"U":{"d":"605,20v-326,0,-463,-163,-463,-492r0,-877r191,0r0,851v-3,223,46,363,271,363v235,0,291,-140,291,-376r0,-838r190,0r0,859v4,340,-142,510,-480,510"},"V":{"d":"713,0r-198,0r-505,-1349r201,0r320,902r84,279r53,-183v10,-33,20,-65,31,-96r318,-902r201,0"},"W":{"d":"1018,0r-208,0r-160,-610r-34,-146r-91,369r-106,387r-208,0r-211,-1349r189,0r109,835r33,346r88,-364r109,-399r175,0r165,626r32,137r35,-346r104,-835r189,0"},"X":{"d":"614,-836r333,-513r205,0r-435,644r476,705r-205,0r-374,-573r-373,573r-205,0r476,-705r-435,-644r205,0"},"Y":{"d":"708,-584r0,584r-188,0r0,-584r-484,-765r205,0r374,611r372,-611r205,0"},"Z":{"d":"1155,0r-1082,0r0,-143r818,-1050r-745,0r0,-156r962,0r0,139r-818,1054r865,0r0,156"},"[":{"d":"410,425r0,-1909r547,0r0,139r-367,0r0,1631r367,0r0,139r-547,0"},"\\":{"d":"932,20r-817,-1504r178,0r821,1504r-182,0"},"]":{"d":"270,425r0,-139r367,0r0,-1631r-367,0r0,-139r547,0r0,1909r-547,0"},"^":{"d":"940,-442r-329,-803r-326,803r-152,0r378,-907r203,0r380,907r-154,0"},"_":{"d":"-5,220r0,-96r1238,0r0,96r-1238,0"},"`":{"d":"702,-1201r-300,-230r0,-29r197,0r227,239r0,20r-124,0"},"a":{"d":"1000,-272v2,96,12,159,101,161v21,0,41,-3,59,-7r0,112v-44,10,-86,16,-139,16v-141,2,-190,-83,-197,-217r-6,0v-71,131,-170,227,-372,227v-207,0,-318,-120,-318,-322v0,-266,195,-349,454,-354r236,-4v11,-190,-40,-305,-222,-305v-139,0,-220,47,-232,172r-188,-17v33,-203,180,-292,423,-292v256,0,401,118,401,364r0,466xm317,-299v0,110,62,184,175,182v165,-2,259,-96,306,-217v24,-64,20,-121,20,-200r-190,4v-176,1,-311,48,-311,231"},"b":{"d":"699,-1104v295,0,391,226,391,558v0,189,-34,331,-102,425v-68,94,-164,141,-290,141v-170,0,-274,-66,-336,-184r-9,164r-174,0r6,-223r0,-1261r180,0r0,423r-4,157r4,0v58,-129,161,-200,334,-200xm648,-113v221,0,256,-195,256,-427v0,-231,-34,-425,-254,-425v-235,0,-285,193,-285,441v0,239,54,411,283,411"},"c":{"d":"631,20v-350,0,-501,-216,-501,-562v0,-357,163,-560,502,-560v249,0,400,119,446,323r-192,14v-23,-124,-109,-196,-262,-196v-242,0,-305,171,-305,415v1,245,61,427,304,427v151,0,248,-77,267,-215r190,12v-39,214,-198,342,-449,342"},"d":{"d":"877,0v-7,-48,-10,-117,-10,-174r-5,0v-61,130,-154,200,-332,200v-302,0,-392,-224,-392,-558v0,-377,131,-566,392,-566v176,0,269,64,335,184r-2,-570r180,0r0,1261r6,223r-172,0xm579,-965v-222,0,-255,195,-255,427v0,231,31,425,253,425v236,0,286,-193,286,-441v0,-240,-53,-411,-284,-411"},"e":{"d":"617,-1102v356,0,481,238,477,599r-772,0v4,221,84,388,301,388v144,0,245,-60,284,-166r158,45v-63,163,-210,256,-442,256v-341,0,-490,-219,-490,-568v0,-347,153,-554,484,-554xm908,-641v-18,-193,-91,-328,-289,-328v-192,0,-288,127,-295,328r584,0"},"f":{"d":"1099,-1318v-177,-13,-457,-66,-503,104v-9,33,-17,80,-16,132r491,0r0,142r-491,0r0,940r-180,0r0,-940r-262,0r0,-142r262,0v-6,-211,58,-339,224,-381v128,-33,338,-21,475,0r0,145"},"g":{"d":"1048,-32v-1,300,-135,456,-433,456v-222,0,-358,-89,-400,-267r184,-25v22,99,100,157,222,156v184,-2,248,-124,248,-315r0,-194r-2,0v-60,121,-161,209,-343,209v-306,-1,-381,-226,-381,-537v0,-319,85,-550,400,-550v163,0,271,83,325,202r3,0r9,-162v2,-13,2,-21,3,-23r171,0r-6,224r0,826xm585,-145v209,-7,284,-177,284,-406v0,-192,-53,-332,-177,-392v-33,-16,-69,-22,-104,-22v-223,2,-259,182,-259,414v0,231,32,413,256,406"},"h":{"d":"868,-695v1,-169,-58,-272,-220,-268v-189,5,-283,138,-283,336r0,627r-180,0r0,-1484r181,0r0,390r-9,197r3,0v62,-120,159,-205,339,-205v242,0,351,135,350,381r0,721r-181,0r0,-695"},"i":{"d":"745,-142r380,0r0,142r-982,0r0,-142r422,0r0,-798r-319,0r0,-142r499,0r0,940xm545,-1292r0,-192r200,0r0,192r-200,0"},"j":{"d":"390,276v166,0,266,-82,266,-251r0,-965r-407,0r0,-142r587,0r0,1110v-3,270,-166,397,-431,397v-106,0,-209,-16,-288,-43r0,-140v79,18,174,34,273,34xm636,-1292r0,-192r200,0r0,192r-200,0"},"k":{"d":"914,0r-366,-499r-132,98r0,401r-180,0r0,-1484r180,0r0,927r475,-525r211,0r-439,465r462,617r-211,0"},"l":{"d":"736,-142r380,0r0,142r-982,0r0,-142r422,0r0,-1200r-289,0r0,-142r469,0r0,1342"},"m":{"d":"904,-1102v199,0,220,175,220,381r0,721r-168,0r0,-686v-2,-115,-1,-216,-60,-264v-68,-33,-125,-3,-158,71v-25,56,-39,140,-39,252r0,627r-168,0r0,-686v-2,-115,1,-219,-61,-264v-32,-23,-84,-18,-112,12v-63,68,-84,194,-84,331r0,607r-169,0r0,-851r-6,-231r149,0v7,47,1,127,8,175v35,-100,83,-195,216,-195v135,0,166,81,196,196v42,-105,93,-196,236,-196"},"n":{"d":"706,-1102v241,0,343,136,343,381r0,721r-181,0r0,-695v1,-169,-58,-272,-220,-268v-189,5,-283,138,-283,336r0,627r-180,0r0,-851r-6,-231r170,0r8,185r3,0v63,-121,164,-205,346,-205"},"o":{"d":"615,-1102v342,0,483,202,482,560v-1,348,-148,562,-488,562v-335,0,-476,-218,-479,-562v-3,-350,157,-560,485,-560xm607,-113v239,0,301,-178,301,-429v0,-247,-55,-427,-290,-427v-235,0,-299,179,-299,427v0,245,61,429,288,429"},"p":{"d":"698,-1104v312,3,392,244,392,558v0,315,-82,566,-392,566v-169,0,-277,-65,-331,-184r-5,0v4,47,3,112,4,166r0,423r-181,0r0,-1283r-6,-224r175,0v6,50,9,121,10,178r4,0v58,-123,150,-202,330,-200xm649,-113v225,0,255,-202,255,-433v0,-226,-32,-419,-253,-419v-235,0,-285,190,-285,441v0,239,53,411,283,411"},"q":{"d":"530,26v-301,-5,-391,-227,-392,-558v0,-187,33,-329,98,-424v65,-95,162,-142,293,-142v179,0,271,70,334,184v1,-55,3,-123,12,-169r175,0v-6,87,-6,179,-6,282r0,1226r-181,0r4,-607r-2,0v-61,123,-152,211,-335,208xm577,-113v233,0,286,-191,286,-441v0,-240,-55,-411,-284,-411v-222,0,-255,196,-255,427v0,228,33,425,253,425"},"r":{"d":"839,-1102v70,0,148,7,206,17r0,167v-113,-18,-267,-36,-363,15v-129,69,-208,204,-208,395r0,508r-180,0r0,-701v-1,-137,-26,-273,-52,-381r171,0v21,74,41,162,48,250r5,0v67,-152,152,-270,373,-270"},"s":{"d":"873,-819v-18,-114,-119,-146,-250,-146v-163,0,-245,50,-245,151v0,150,173,150,294,185v181,53,388,94,388,320v0,240,-189,326,-439,329v-245,3,-409,-69,-454,-268r159,-31v25,133,136,168,295,165v144,-2,270,-31,270,-171v0,-117,-101,-143,-199,-168r-132,-34v-168,-47,-350,-87,-350,-299v0,-217,172,-315,413,-313v220,2,373,77,412,260"},"t":{"d":"682,16v-209,-1,-323,-80,-324,-285r0,-671r-168,0r0,-142r170,0r58,-282r120,0r0,282r432,0r0,142r-432,0r0,652v2,114,60,155,182,155v105,-1,210,-17,297,-34r0,137v-95,25,-212,46,-335,46"},"u":{"d":"528,20v-247,0,-343,-132,-343,-381r0,-721r180,0r0,686v-3,179,45,283,224,277v194,-6,279,-136,279,-336r0,-627r181,0r0,851r6,231r-170,0r-8,-185r-3,0v-65,121,-159,205,-346,205"},"v":{"d":"715,0r-213,0r-433,-1082r202,0r268,704r69,237r74,-235r276,-706r201,0"},"w":{"d":"1018,0r-204,0r-200,-673r-59,206r-148,467r-203,0r-183,-1082r178,0r101,674r21,184v3,31,4,56,4,75r58,-214r135,-424r193,0r145,481r40,157v20,-334,90,-624,136,-933r176,0"},"x":{"d":"932,0r-321,-444r-323,444r-194,0r415,-556r-397,-526r199,0r300,421r298,-421r201,0r-397,524r420,558r-201,0"},"y":{"d":"168,279v221,38,310,-113,368,-290r-470,-1071r192,0r348,856v8,21,13,34,14,40r351,-896r190,0r-456,1082v-65,165,-130,321,-275,396v-68,36,-176,35,-262,18r0,-135"},"z":{"d":"147,0r0,-137r681,-806r-641,0r0,-139r844,0r0,137r-682,806r719,0r0,139r-921,0"},"{":{"d":"677,91v1,136,42,195,171,195r213,0r0,139v-132,-6,-284,19,-384,-22v-105,-43,-175,-136,-175,-281r0,-351v-2,-163,-121,-222,-275,-232r0,-137v154,-9,275,-69,275,-231r0,-352v5,-189,107,-303,294,-303r265,0r0,139r-213,0v-126,-2,-171,66,-171,195r0,346v-3,159,-110,234,-231,274v127,35,231,116,231,274r0,347"},"|":{"d":"531,425r0,-1909r166,0r0,1909r-166,0"},"}":{"d":"1001,-461v-154,10,-275,69,-275,232r0,351v-6,187,-108,303,-294,303r-265,0r0,-139r213,0v129,-2,171,-60,172,-195r0,-347v3,-160,108,-236,230,-276v-124,-35,-230,-116,-230,-272r0,-346v2,-128,-45,-195,-172,-195r-213,0r0,-139r265,0v187,6,294,114,294,303r0,352v3,162,121,221,275,231r0,137"},"~":{"d":"108,-723v89,-78,274,-103,422,-61v116,33,208,94,346,94v103,0,182,-43,244,-92r0,149v-69,49,-143,81,-260,80v-172,-1,-347,-117,-504,-115v-112,1,-181,41,-248,88r0,-143"}}});
/*!
 * The following copyright notice may not be removed under any circumstances.
 * 
 * Copyright:
 * � 2006 Microsoft Corporation. All Rights Reserved.
 * 
 * Description:
 * Trebuchet, designed by Vincent Connare in 1996, is a humanist sans serif
 * designed for easy screen readability. Trebuchet takes its inspiration from the
 * sans serifs of the 1930s which had large x heights and round features intended
 * to promote readability on signs. The typeface name is credited to a puzzle heard
 * at Microsoft, where the question was asked, "could you build a Trebuchet (a form
 * of medieval catapult) to launch a person from the main campus to the consumer
 * campus, and how?" The Trebuchet fonts are intended to be the vehicle that fires
 * your messages across the Internet. "Launch your message with a Trebuchet page".
 * 
 * Manufacturer:
 * Microsoft Corporation
 * 
 * Designer:
 * Vincent Connare
 * 
 * Vendor URL:
 * http://www.microsoft.com
 * 
 * License information:
 * http://www.microsoft.com/typography/fonts/
 */
Raphael.registerFont({"w":188,"face":{"font-family":"Trebuchet MS","font-weight":400,"font-stretch":"normal","units-per-em":"360","panose-1":"2 11 6 3 2 2 2 2 2 4","ascent":"288","descent":"-72","x-height":"4","bbox":"-1 -289 304 75","underline-thickness":"22.3242","underline-position":"-34.8047","unicode-range":"U+0020-U+007E"},"glyphs":{" ":{"w":108,"k":{"Y":7,"T":7,"A":20}},"!":{"d":"73,-67r-13,0v-15,-96,-13,-114,-13,-195r39,0v0,81,2,98,-13,195xm41,-23v0,-14,12,-26,27,-26v14,0,26,12,26,26v0,14,-12,27,-26,27v-14,0,-27,-13,-27,-27","w":132},"\"":{"d":"40,-191r-23,0r-4,-67r32,0xm98,-191r-23,0r-4,-67r32,0","w":116},"#":{"d":"155,-166r-18,69r28,0r0,22r-34,0r-21,79r-23,0r22,-79r-52,0r-22,79r-23,0r22,-79r-27,0r0,-22r33,0r17,-69r-30,0r0,-23r36,0r18,-72r23,0r-18,72r52,0r18,-72r22,0r-18,72r31,0r0,23r-36,0xm80,-166r-17,69r52,0r17,-69r-52,0"},"$":{"d":"156,-110v27,46,4,111,-51,113r0,40r-24,0r0,-39v-14,1,-47,-11,-56,-16r12,-32v32,31,120,15,93,-42v-21,-43,-106,-36,-106,-109v0,-35,25,-61,57,-66r0,-28r24,0r0,27v25,1,42,6,51,14r-10,31v-24,-18,-89,-25,-87,21v3,53,76,51,97,86"},"%":{"d":"38,4r-22,0r155,-266r22,0xm109,-201v0,33,-18,60,-49,60v-33,0,-49,-21,-49,-63v0,-32,19,-59,50,-58v31,0,48,26,48,61xm61,-244v-20,0,-28,20,-28,42v0,22,7,43,25,43v19,0,28,-14,28,-43v0,-28,-8,-42,-25,-42xm204,-56v0,33,-19,59,-49,60v-33,0,-49,-21,-49,-63v0,-32,19,-59,50,-58v31,0,48,26,48,61xm156,-99v-20,0,-29,19,-28,41v0,23,7,44,25,44v19,0,28,-14,28,-43v0,-28,-8,-42,-25,-42","w":216},"&":{"d":"181,-126v0,48,-9,125,51,93r5,31v-24,7,-56,11,-74,-7v-59,30,-145,8,-138,-71v3,-33,9,-46,28,-66v-52,-42,-16,-116,50,-116v24,0,43,5,56,16r-15,27v-27,-30,-85,-19,-82,25v0,15,6,28,20,39r66,0r0,-32r33,-13r0,46r44,0r0,28r-44,0xm150,-35v-4,-26,-1,-62,-2,-91r-71,0v-31,35,-20,100,37,100v16,0,28,-3,36,-9","w":254},"'":{"d":"40,-191r-23,0r-4,-67r32,0","w":57},"(":{"d":"109,75v-68,-45,-99,-176,-53,-270v16,-33,33,-54,53,-64r0,14v-48,55,-45,256,0,302r0,18","w":132},")":{"d":"34,-259v65,36,97,176,55,263v-15,30,-31,54,-55,71r0,-18v45,-46,48,-247,0,-302r0,-14","w":132},"*":{"d":"120,-203v-11,6,-28,5,-45,5v13,9,27,17,36,30r-22,18v-10,-12,-16,-26,-24,-40r-23,40r-23,-18v6,-15,23,-19,36,-27v-16,-3,-33,-5,-47,-10r13,-27v16,5,27,15,39,24v-4,-17,-12,-29,-11,-50r31,0v1,21,-7,33,-11,50v13,-8,24,-19,41,-24","w":132},"+":{"d":"107,-124r62,0r0,25r-62,0r0,60r-24,0r0,-60r-62,0r0,-25r62,0r0,-60r24,0r0,60"},",":{"d":"66,-49v30,2,30,49,15,71v-7,12,-21,26,-42,42r-9,-13v20,-17,31,-30,31,-42v0,-16,-23,-22,-21,-36v-1,-13,12,-23,26,-22","w":132},"-":{"d":"28,-89r0,-31r75,0r0,31r-75,0","w":132},"\u2010":{"d":"28,-89r0,-31r75,0r0,31r-75,0","w":132},".":{"d":"36,-23v0,-14,12,-26,26,-26v15,0,27,12,27,26v0,14,-13,27,-27,27v-14,0,-26,-13,-26,-27","w":132},"\/":{"d":"62,0r-29,0r94,-259r28,0"},"0":{"d":"95,4v-72,0,-83,-49,-84,-141v0,-66,27,-125,86,-125v67,0,81,48,81,131v0,72,-20,135,-83,135xm143,-133v0,-56,-1,-99,-47,-99v-33,0,-50,33,-50,99v0,71,16,107,46,107v47,0,51,-44,51,-107"},"1":{"d":"35,-198v25,-12,62,-40,77,-61r11,0r0,259r-35,0r0,-197r-53,32r0,-33"},"2":{"d":"76,-262v85,0,93,73,51,139r-58,91r101,0r0,32r-158,0r0,-7v32,-58,96,-118,106,-190v7,-48,-75,-41,-85,-9r-23,-18v8,-22,34,-38,66,-38"},"3":{"d":"165,-71v0,76,-98,95,-146,53r17,-27v25,32,97,24,92,-29v-3,-31,-21,-50,-54,-49v1,-9,-2,-22,1,-29v30,0,45,-13,45,-39v0,-45,-56,-52,-79,-26r-15,-24v34,-41,131,-19,131,43v0,28,-19,53,-40,60v27,8,48,33,48,67"},"4":{"d":"155,-70r0,70r-33,0r0,-70r-118,0r0,-20r139,-169r12,0r0,162r26,0r0,27r-26,0xm122,-188r-76,91r76,0r0,-91"},"5":{"d":"62,-166v51,-29,114,10,107,73v10,93,-88,120,-146,76r13,-29v39,36,96,24,96,-42v0,-61,-59,-74,-91,-38r-12,-8r0,-125r128,0r0,30r-95,0r0,63"},"6":{"d":"174,-79v0,47,-31,81,-75,83v-94,5,-104,-141,-51,-208v24,-31,45,-52,70,-58r17,19v-17,4,-78,75,-77,96v48,-37,116,4,116,68xm138,-78v1,-28,-16,-54,-42,-53v-30,0,-44,16,-44,50v0,37,15,56,45,56v27,0,41,-24,41,-53"},"7":{"d":"75,0r-39,0v18,-59,72,-171,100,-225r-121,0r0,-34r167,0v1,28,-14,39,-23,59r-69,157v-6,16,-11,30,-15,43"},"8":{"d":"94,4v-96,0,-97,-124,-32,-147v-19,-10,-37,-31,-37,-57v-1,-39,30,-62,70,-62v78,0,87,97,33,122v75,32,54,144,-34,144xm129,-201v0,-19,-14,-32,-34,-31v-23,0,-35,11,-35,32v0,16,15,31,45,46v16,-15,24,-31,24,-47xm94,-26v36,0,58,-43,36,-72v-6,-8,-20,-19,-41,-30v-26,14,-38,33,-38,57v0,25,18,45,43,45"},"9":{"d":"13,-178v0,-47,30,-82,74,-84v94,-5,105,140,52,208v-25,31,-45,52,-70,58r-17,-18v16,-5,77,-76,77,-96v-49,35,-116,-4,-116,-68xm49,-180v-1,29,16,54,42,54v30,0,44,-17,44,-51v0,-37,-15,-55,-45,-55v-28,-1,-41,24,-41,52"},":":{"d":"36,-165v0,-14,12,-27,26,-27v14,0,27,13,27,27v0,14,-13,26,-27,26v-13,0,-26,-13,-26,-26xm36,-23v0,-14,12,-26,26,-26v15,0,27,12,27,26v0,14,-13,27,-27,27v-14,0,-26,-13,-26,-27","w":132},";":{"d":"36,-165v0,-14,12,-27,26,-27v14,0,27,13,27,27v0,14,-13,26,-27,26v-13,0,-26,-13,-26,-26xm66,-49v30,2,30,49,15,71v-7,12,-21,26,-42,42r-9,-13v20,-17,31,-30,31,-42v0,-16,-23,-22,-21,-36v-1,-13,12,-23,26,-22","w":132},"<":{"d":"156,-38r-130,-63r0,-22r130,-62r0,28r-100,45r100,45r0,29"},"=":{"d":"169,-154r0,25r-148,0r0,-25r148,0xm169,-94r0,25r-148,0r0,-25r148,0"},">":{"d":"156,-101r-130,63r0,-29r101,-45r-101,-45r0,-28r130,62r0,22"},"?":{"d":"7,-248v44,-34,139,-5,110,65v-15,36,-67,53,-53,108r-23,0v-27,-59,42,-84,48,-129v4,-34,-50,-40,-69,-18xm31,-23v0,-14,11,-26,26,-26v14,0,26,11,26,26v0,15,-12,27,-26,27v-14,0,-26,-12,-26,-27","w":132},"@":{"d":"43,-102v0,88,102,134,164,82v5,2,13,5,23,10v-22,22,-51,34,-88,34v-74,1,-124,-51,-124,-126v0,-75,51,-131,124,-131v70,0,119,48,118,117v0,37,-21,72,-58,71v-19,0,-32,-4,-40,-12v-23,25,-79,16,-77,-24v1,-33,33,-46,70,-46v0,-31,-34,-29,-50,-16r-8,-17v35,-24,90,-8,84,45r0,42v29,23,54,4,54,-44v0,-52,-41,-94,-93,-94v-61,0,-99,48,-99,109xm155,-110v-43,-11,-60,47,-20,50v7,0,14,-3,20,-9r0,-41","w":277},"A":{"d":"173,0r-18,-54r-96,0r-19,54r-39,0r104,-261r10,0r97,261r-39,0xm108,-194r-40,114r77,0","w":212,"k":{"y":15,"w":17,"v":20,"Y":38,"W":32,"V":32,"T":35," ":20}},"B":{"d":"190,-74v0,75,-83,78,-164,74r0,-258v81,-6,143,-7,148,62v2,24,-23,47,-43,51v38,10,58,27,59,71xm62,-229r0,74v37,5,82,-3,77,-40v5,-35,-43,-40,-77,-34xm153,-80v0,-47,-42,-52,-91,-48r0,98v50,6,91,-1,91,-50","w":203},"C":{"d":"14,-128v0,-71,43,-135,111,-134v28,0,50,5,66,14r-12,30v-11,-8,-29,-12,-53,-12v-50,1,-75,48,-75,104v0,53,28,98,75,99v24,0,43,-9,56,-26r19,27v-20,20,-46,30,-78,30v-71,0,-109,-57,-109,-132","w":215},"D":{"d":"26,-258v117,-14,177,23,181,119v4,114,-65,149,-181,139r0,-258xm62,-33v73,11,108,-32,108,-103v0,-71,-38,-101,-108,-90r0,193","w":220},"E":{"d":"62,-226r0,72r85,0r0,30r-85,0r0,92r116,0r0,32r-152,0r0,-258r154,0r0,32r-118,0","w":192},"F":{"d":"62,-226r0,72r90,0r0,30r-90,0r0,124r-36,0r0,-258r159,0r0,32r-123,0","k":{"A":38,".":65,",":65}},"G":{"d":"14,-128v0,-104,109,-172,191,-112r-15,29v-65,-50,-139,4,-139,85v0,76,74,127,131,82r0,-60r-36,0r0,-30r71,0r0,112v-16,15,-57,26,-88,26v-73,1,-115,-56,-115,-132","w":243},"H":{"d":"174,0r0,-124r-112,0r0,124r-36,0r0,-258r36,0r0,104r112,0r0,-104r35,0r0,258r-35,0","w":235},"I":{"d":"33,0r0,-258r35,0r0,258r-35,0","w":100},"J":{"d":"145,-258v-10,103,38,262,-77,262v-34,0,-58,-22,-59,-56r30,0v3,16,12,24,28,24v43,-2,43,-15,43,-67r0,-163r35,0","w":171},"K":{"d":"168,0r-72,-118r-34,48r0,70r-36,0r0,-258r36,0r0,141r95,-141r39,0r-77,112r88,146r-39,0","w":207,"k":{"w":11,"u":11,"o":11,"n":11,"i":11,"e":11}},"L":{"d":"26,0r0,-258r36,0r0,226r116,0r0,32r-152,0","w":182,"k":{"y":30,"Y":47,"W":45,"V":50,"T":37," ":13}},"M":{"d":"220,0r-30,-165r-57,169r-8,0r-58,-169r-30,165r-33,0r48,-258r16,0r61,188r57,-188r15,0r53,258r-34,0","w":255},"N":{"d":"193,4r-133,-189r0,185r-34,0r0,-258r14,0r130,179r0,-179r33,0r0,262r-10,0","w":229},"O":{"d":"118,4v-68,0,-104,-62,-104,-135v0,-69,38,-132,104,-131v75,0,111,54,111,131v0,78,-36,135,-111,135xm118,-230v-50,0,-66,45,-67,99v-1,53,20,104,67,104v53,0,75,-45,74,-104v0,-66,-25,-99,-74,-99","w":242},"P":{"d":"62,-99r0,99r-36,0r0,-258v92,-7,161,8,161,74v0,67,-50,95,-125,85xm62,-226r0,95v54,8,88,-8,88,-50v0,-37,-41,-53,-88,-45","w":200,"k":{"r":17,"o":17,"i":17,"h":17,"e":17,"a":17,"A":40,".":70,",":70," ":7}},"Q":{"d":"118,-262v75,0,111,54,111,131v0,59,-19,100,-54,122v16,25,50,30,92,28r-5,34v-61,0,-102,-17,-121,-51v-82,15,-127,-53,-127,-133v0,-69,38,-132,104,-131xm118,-27v52,0,75,-46,74,-104v0,-66,-25,-99,-74,-99v-50,0,-66,45,-67,99v-1,53,20,104,67,104","w":243},"R":{"d":"185,-186v0,31,-24,62,-50,68r75,118r-41,0r-68,-111v-8,0,-21,0,-38,-1r0,112r-35,0r0,-258v76,-7,157,-1,157,72xm148,-187v0,-40,-42,-44,-85,-39r0,84v43,5,85,1,85,-45","w":209,"k":{"u":10,"o":15,"e":15,"Y":23,"W":23,"V":17,"T":15}},"S":{"d":"111,-139v78,32,52,143,-38,143v-23,0,-42,-5,-58,-16r13,-32v27,24,96,25,96,-23v0,-53,-79,-52,-99,-88v-27,-49,5,-107,62,-107v28,0,48,5,59,14r-10,31v-24,-19,-89,-24,-87,21v1,38,32,45,62,57","w":173},"T":{"d":"120,-226r0,226r-35,0r0,-226r-82,0r0,-32r203,0r0,32r-86,0","w":209,"k":{"y":41,"w":50,"u":47,"s":43,"r":40,"o":45,"i":15,"e":45,"c":45,"a":45,"O":20,"A":35,";":40,":":40,".":60,"-":35,",":60," ":7}},"U":{"d":"116,4v-56,0,-90,-28,-90,-83r0,-179r36,0r0,177v-1,32,22,54,54,54v34,0,56,-21,56,-55r0,-176r35,0r0,180v1,53,-36,82,-91,82","w":233},"V":{"d":"116,4r-18,0r-96,-262r39,0r67,190r63,-190r38,0","w":211,"k":{"y":13,"u":23,"r":22,"o":23,"i":7,"e":23,"a":28,"A":37,";":22,":":22,".":53,"-":27,",":53}},"W":{"d":"224,4r-11,0r-61,-178r-57,178r-12,0r-81,-262r37,0r52,180r56,-180r12,0r56,180r53,-180r36,0","w":306,"k":{"y":7,"u":15,"r":18,"o":17,"i":5,"e":17,"a":20,"A":32,";":7,":":7,".":33,"-":25,",":33}},"X":{"d":"161,0r-64,-103r-59,103r-36,0r76,-134r-70,-124r35,0r55,98r61,-98r35,0r-80,125r84,133r-37,0","w":200},"Y":{"d":"120,-115r0,115r-35,0r0,-115r-83,-143r36,0r65,113r64,-113r36,0","w":205,"k":{"v":21,"u":27,"q":43,"p":33,"o":41,"i":20,"e":38,"a":33,"A":38,";":31,":":31,".":58,"-":44,",":58," ":7}},"Z":{"d":"18,0r0,-9r110,-217r-109,0r0,-32r158,0r0,9r-111,217r115,0r0,32r-163,0","w":198},"[":{"d":"36,74r0,-339r81,0r0,29r-46,0r0,280r46,0r0,30r-81,0","w":132},"\\":{"d":"90,0r-91,-259r25,0r91,259r-25,0","w":127},"]":{"d":"97,74r-82,0r0,-30r47,0r0,-280r-47,0r0,-29r82,0r0,339","w":132},"^":{"d":"134,-159r-43,-79r-43,79r-22,0r56,-100r19,0r55,100r-22,0"},"_":{"d":"-1,45r0,-23r190,0r0,23r-190,0"},"`":{"d":"98,-226r-39,-58r34,0r30,58r-25,0"},"a":{"d":"175,3v-27,1,-38,-6,-45,-25v-28,43,-116,31,-116,-31v0,-48,62,-81,113,-63v6,-54,-64,-55,-89,-29r-14,-28v11,-9,38,-19,58,-19v83,0,81,66,78,146v0,17,5,27,15,33r0,16xm127,-92v-39,-13,-80,6,-80,40v0,42,63,35,80,5r0,-45","w":189},"b":{"d":"187,-98v9,79,-78,131,-135,84v-6,9,-9,22,-28,18r0,-269r33,0r0,91v49,-46,138,5,130,76xm152,-96v3,-55,-58,-88,-95,-53r0,109v0,4,27,16,32,15v48,0,60,-22,63,-71","w":200},"c":{"d":"11,-92v0,-83,90,-127,155,-81r-17,24v-40,-33,-111,-5,-102,57v-6,62,63,86,107,50r13,28v-63,43,-156,6,-156,-78","w":178},"d":{"d":"13,-89v-6,-69,71,-132,130,-89r0,-87r33,0r0,265r-33,0r0,-14v-52,43,-140,-1,-130,-75xm48,-93v-7,60,58,86,95,53r0,-105v-32,-45,-102,-2,-95,52","w":200},"e":{"d":"100,-192v58,0,96,43,82,101r-135,0v-7,61,66,84,107,50r14,24v-13,12,-43,21,-69,21v-51,-1,-88,-43,-88,-96v0,-54,37,-100,89,-100xm152,-115v3,-45,-58,-65,-88,-34v-9,10,-16,20,-17,34r105,0","w":196},"f":{"d":"39,-188v-3,-56,41,-91,96,-72r-9,24v-33,-12,-61,12,-54,48r39,0r0,28r-39,0r0,160r-33,0r0,-160r-28,0r0,-28r28,0","w":133},"g":{"d":"170,16v0,66,-110,71,-153,36r18,-27v19,13,38,19,54,19v24,0,49,-7,49,-27v0,-52,-120,14,-117,-47v0,-15,18,-25,33,-28v-66,-24,-43,-134,31,-134v19,0,34,4,44,12r17,-20r21,20r-20,15v33,44,-1,116,-51,114v-18,3,-45,0,-49,15v6,16,48,2,64,2v36,0,59,16,59,50xm126,-123v0,-23,-16,-42,-38,-42v-24,-1,-40,19,-40,42v0,25,15,47,40,46v24,-1,38,-20,38,-46","w":180},"h":{"d":"109,-192v84,-1,61,111,64,192r-33,0v-7,-61,24,-161,-40,-164v-17,-1,-36,14,-43,24r0,140r-33,0r0,-265r33,0r0,97v8,-12,31,-24,52,-24","w":196},"i":{"d":"38,-239v0,-11,9,-20,20,-20v11,0,21,9,21,20v0,12,-9,21,-21,21v-11,0,-20,-10,-20,-21xm40,0r0,-160r-26,0r0,-28r59,0r0,188r-33,0","w":102},"j":{"d":"55,-239v0,-11,9,-20,20,-20v11,0,21,9,21,20v0,12,-9,21,-21,21v-11,0,-20,-10,-20,-21xm3,44v42,-1,60,-8,60,-45r0,-159r-37,0r0,-28r71,0r0,186v-1,56,-33,76,-94,76r0,-30","w":132},"k":{"d":"145,0r-59,-94r-29,30r0,64r-33,0r0,-265r33,0r0,164r72,-87r39,0r-60,71r74,117r-37,0","w":181},"l":{"d":"60,-59v-1,20,13,33,31,33r0,30v-43,0,-65,-19,-65,-57r0,-212r34,0r0,206","w":106},"m":{"d":"162,-167v27,-44,113,-27,113,41r0,126r-33,0v-7,-59,25,-163,-39,-164v-16,0,-32,14,-37,25r0,139r-33,0r0,-134v-1,-41,-67,-34,-76,-5r0,139r-33,0r0,-188r22,0r11,22v22,-36,85,-33,105,-1","w":298},"n":{"d":"140,-110v11,-64,-62,-65,-83,-30r0,140r-33,0r0,-188r23,0r10,24v31,-50,116,-33,116,47r0,117r-33,0r0,-110","w":196},"o":{"d":"97,4v-56,0,-86,-42,-86,-99v0,-54,33,-97,86,-97v55,0,85,40,85,97v1,56,-31,99,-85,99xm97,-165v-34,0,-50,30,-50,70v0,47,17,71,50,71v35,0,50,-33,50,-71v0,-47,-17,-70,-50,-70","w":193},"p":{"d":"188,-94v7,74,-72,123,-131,84r0,84r-33,0r0,-262r33,0r0,15v55,-48,140,0,131,79xm153,-95v9,-62,-59,-87,-96,-53r0,110v37,30,104,5,96,-57","w":200},"q":{"d":"13,-94v0,-75,78,-127,136,-80r9,-14r20,0r0,262r-34,0r0,-85v-10,10,-26,15,-49,15v-54,0,-82,-41,-82,-98xm48,-94v-7,57,56,87,96,57r0,-112v-38,-37,-102,0,-96,55","w":200},"r":{"d":"126,-156v-32,-24,-66,12,-66,48r0,108r-34,0r0,-188r34,0r0,30v17,-30,40,-40,80,-31","w":139,"k":{".":48,",":51}},"s":{"d":"92,-105v65,21,48,109,-25,109v-20,0,-39,-5,-56,-15r12,-32v19,12,34,18,45,18v21,0,31,-9,31,-26v0,-42,-90,-37,-86,-92v4,-52,67,-61,113,-36r-10,31v-20,-19,-63,-25,-68,4v-4,22,26,33,44,39","w":145},"t":{"d":"134,-2v-47,17,-98,-1,-98,-53r0,-107r-22,0r0,-26r22,0r0,-40r33,-12r0,52r52,0r0,26r-52,0v3,59,-21,164,60,131","w":142},"u":{"d":"86,4v-88,4,-60,-111,-64,-192r33,0r0,120v-5,61,77,48,87,12r0,-132r33,0r0,188r-33,0r0,-26v-7,13,-35,30,-56,30","w":196},"v":{"d":"92,4r-9,0r-81,-193r37,0r49,132r51,-132r35,0","w":176,"k":{".":48,",":48}},"w":{"d":"198,4r-9,0r-55,-129r-55,129r-9,0r-67,-193r35,0r41,124r50,-124r8,0r52,124r43,-124r33,0","w":267,"k":{".":38,",":38}},"x":{"d":"138,0r-51,-69r-46,69r-39,0r68,-96r-62,-92r37,0r43,64r47,-64r37,0r-69,92r75,96r-40,0","w":180},"y":{"d":"22,44v37,2,60,-26,45,-64r-65,-168r34,0r56,145r49,-145r34,0r-79,220v-8,23,-42,43,-74,42r0,-30","w":177,"k":{".":44,",":44}},"z":{"d":"59,-30r105,0r0,30r-157,0r0,-9r107,-149r-105,0r0,-30r154,0r0,9","w":170},"{":{"d":"76,-56v-9,43,-30,117,48,105r0,25v-49,4,-94,-11,-94,-53v0,-36,37,-113,-23,-113r0,-15v54,-1,30,-72,23,-107v2,-40,46,-54,94,-50r0,23v-32,-1,-59,-2,-59,33v0,15,12,45,11,58v0,19,-14,35,-40,50v19,8,38,23,40,44","w":132},"|":{"d":"81,49r0,-296r26,0r0,296r-26,0"},"}":{"d":"101,21v0,41,-45,58,-94,53r0,-25v36,2,59,-8,59,-40v0,-17,-12,-50,-11,-65v2,-21,21,-36,40,-44v-53,-24,-35,-60,-29,-108v5,-35,-26,-34,-59,-33r0,-23v48,-4,92,9,94,50v-6,34,-32,106,23,107r0,15v-59,1,-23,76,-23,113","w":132},"~":{"d":"60,-126v26,-3,71,33,83,0r16,0v-7,57,-62,31,-96,23v-8,0,-15,5,-19,14r-16,0v3,-18,14,-35,32,-37"},"\u00a0":{"w":108,"k":{"Y":7,"T":7,"A":20}}}});
/*!
 * The following copyright notice may not be removed under any circumstances.
 * 
 * Copyright:
 * � 2006 Microsoft Corporation. All Rights Reserved.
 * 
 * Description:
 * Trebuchet, designed by Vincent Connare in 1996, is a humanist sans serif
 * designed for easy screen readability. Trebuchet takes its inspiration from the
 * sans serifs of the 1930s which had large x heights and round features intended
 * to promote readability on signs. The typeface name is credited to a puzzle heard
 * at Microsoft, where the question was asked, "could you build a Trebuchet (a form
 * of medieval catapult) to launch a person from the main campus to the consumer
 * campus, and how?" The Trebuchet fonts are intended to be the vehicle that fires
 * your messages across the Internet. "Launch your message with a Trebuchet page".
 * 
 * Manufacturer:
 * Microsoft Corporation
 * 
 * Designer:
 * Vincent Connare
 * 
 * Vendor URL:
 * http://www.microsoft.com
 * 
 * License information:
 * http://www.microsoft.com/typography/fonts/
 */
Raphael.registerFont({"w":210,"face":{"font-family":"Trebuchet MS","font-weight":700,"font-stretch":"normal","units-per-em":"360","panose-1":"2 11 7 3 2 2 2 2 2 4","ascent":"288","descent":"-72","x-height":"4","bbox":"-2 -291 317 80","underline-thickness":"35.1562","underline-position":"-28.3008","unicode-range":"U+0020-U+007E"},"glyphs":{" ":{"w":108,"k":{"Y":7,"T":7,"A":20}},"!":{"d":"75,-67r-18,0v-15,-95,-15,-113,-14,-195r46,0v1,81,1,100,-14,195xm38,-25v0,-15,13,-29,29,-29v16,0,29,14,29,29v0,15,-14,29,-29,29v-15,0,-29,-14,-29,-29","w":132},"\"":{"d":"117,-182r-33,0r-5,-76r44,0xm50,-182r-33,0r-5,-76r44,0","w":132},"#":{"d":"206,-160r-37,0r-15,56r27,0r0,32r-36,0r-21,76r-34,0r21,-76r-41,0r-20,76r-35,0r21,-76r-25,0r0,-32r34,0r14,-56r-27,0r0,-32r36,0r19,-69r34,0r-19,69r40,0r19,-69r34,0r-18,69r29,0r0,32xm135,-160r-41,0r-15,56r41,0"},"$":{"d":"160,-124v42,39,20,120,-37,125r0,40r-40,0r0,-37v-20,-1,-39,-7,-56,-18r17,-41v18,13,36,19,53,19v27,0,41,-9,41,-28v0,-64,-115,-50,-110,-129v2,-34,25,-59,55,-66r0,-32r40,0r0,30v22,2,37,8,48,16r-13,39v-26,-21,-83,-29,-85,13v-7,24,69,53,87,69"},"%":{"d":"114,-198v0,36,-21,62,-54,62v-36,0,-55,-21,-55,-65v0,-34,23,-61,56,-61v34,0,53,26,53,64xm38,-200v0,20,6,37,20,37v15,0,23,-13,23,-37v0,-23,-6,-35,-20,-35v-15,0,-23,12,-23,35xm59,4r-35,0r162,-266r34,0xm237,-59v0,36,-21,63,-54,63v-36,0,-55,-22,-55,-66v0,-34,23,-61,56,-61v34,0,53,26,53,64xm161,-60v0,19,5,36,20,36v15,0,23,-12,23,-36v0,-23,-6,-35,-20,-35v-15,0,-23,12,-23,35","w":246},"&":{"d":"186,-121v3,34,-11,86,24,86v8,0,16,-2,24,-6r0,39v-24,7,-52,11,-71,-6v-64,30,-143,5,-143,-74v0,-25,9,-45,26,-63v-50,-44,-10,-117,57,-117v25,0,47,6,63,19r-19,32v-29,-26,-78,-21,-80,20v0,13,6,23,17,32r58,0r0,-29r44,-17r0,47r44,0r0,37r-44,0xm144,-41v-4,-22,-1,-54,-2,-80r-63,0v-27,30,-15,86,35,86v13,0,23,-2,30,-6","w":254},"'":{"d":"59,-182r-33,0r-5,-76r44,0","w":82},"(":{"d":"114,80v-75,-46,-112,-177,-61,-276v17,-33,37,-55,61,-67r0,25v-48,52,-45,244,0,288r0,30","w":132},")":{"d":"29,-263v72,36,111,177,63,268v-16,30,-35,56,-63,75r0,-30v44,-44,47,-236,0,-288r0,-25","w":132},"*":{"d":"144,-205v-14,7,-29,13,-50,13v16,8,30,19,40,33r-34,26v-10,-13,-18,-27,-24,-44v-6,18,-18,31,-29,44r-30,-27v12,-12,23,-24,40,-31v-21,0,-36,-7,-51,-13r17,-36v16,6,32,13,41,26v-6,-15,-12,-29,-10,-52r42,1v2,21,-3,36,-8,51v11,-12,25,-21,42,-26","w":155},"+":{"d":"125,-94r0,62r-35,0r0,-62r-61,0r0,-35r61,0r0,-61r35,0r0,61r62,0r0,35r-62,0"},",":{"d":"66,-49v34,1,36,47,19,72v-8,11,-23,26,-47,43r-15,-19v21,-16,32,-29,32,-38v0,-16,-23,-18,-20,-33v0,-15,15,-26,31,-25","w":132},"-":{"d":"19,-84r0,-41r93,0r0,41r-93,0","w":132},"\u2010":{"d":"19,-84r0,-41r93,0r0,41r-93,0","w":132},".":{"d":"62,9v-17,0,-31,-15,-31,-32v0,-17,14,-32,31,-32v17,0,32,14,32,32v0,18,-15,32,-32,32","w":132},"\/":{"d":"42,0r-39,0r97,-259r39,0","w":140},"0":{"d":"105,4v-73,0,-91,-57,-92,-141v-1,-64,34,-126,95,-125v60,0,90,44,90,131v0,73,-28,135,-93,135xm150,-133v0,-56,-2,-92,-43,-92v-31,0,-46,31,-46,92v1,54,4,94,43,100v45,-4,46,-41,46,-100"},"1":{"d":"100,0r0,-186r-52,32r0,-44v34,-16,59,-37,79,-61r19,0r0,259r-46,0"},"2":{"d":"97,-262v86,0,100,74,55,141r-53,80r97,0r0,41r-169,0r0,-13v32,-56,93,-113,106,-181v-1,-41,-66,-36,-78,-1r-31,-24v11,-23,39,-43,73,-43"},"3":{"d":"183,-74v0,80,-110,101,-158,52r23,-35v25,33,90,30,88,-19v-1,-28,-22,-46,-55,-42r0,-38v29,1,46,-9,46,-33v0,-41,-52,-43,-73,-16r-22,-32v36,-43,143,-30,143,42v0,25,-11,44,-33,57v27,13,41,34,41,64"},"4":{"d":"173,-67r0,67r-44,0r0,-67r-117,0r0,-27r141,-165r20,0r0,155r26,0r0,37r-26,0xm129,-181r-66,77r66,0r0,-77"},"5":{"d":"80,-174v58,-19,107,18,107,79v0,97,-97,124,-158,75r18,-37v39,36,92,30,92,-33v0,-56,-57,-64,-85,-29r-18,-12r0,-128r139,0r0,39r-95,0r0,46"},"6":{"d":"193,-81v0,47,-34,85,-80,85v-99,0,-112,-140,-55,-208v25,-30,49,-52,76,-59r24,26v-31,15,-66,48,-77,80v57,-26,112,15,112,76xm146,-80v0,-26,-12,-46,-36,-46v-26,0,-39,15,-39,44v0,31,13,47,40,47v24,0,35,-19,35,-45"},"7":{"d":"94,0r-50,0v19,-59,52,-131,99,-216r-118,0r0,-43r177,0v3,32,-13,44,-23,64r-49,102v-14,31,-26,62,-36,93"},"8":{"d":"104,4v-93,0,-106,-116,-42,-145v-16,-10,-32,-32,-32,-56v-1,-41,33,-65,75,-65v45,0,74,23,75,65v0,21,-20,51,-36,57v20,8,45,40,45,66v0,49,-35,78,-85,78xm109,-159v25,-9,39,-64,-4,-64v-31,0,-37,30,-19,48v7,8,15,13,23,16xm104,-35v23,0,40,-13,40,-35v0,-18,-15,-36,-44,-53v-22,13,-34,29,-34,49v0,22,16,39,38,39"},"9":{"d":"20,-176v0,-49,33,-86,80,-86v99,0,112,140,55,208v-25,30,-48,52,-75,59r-25,-26v36,-20,61,-45,76,-77v-58,19,-111,-18,-111,-78xm103,-223v-24,0,-36,20,-36,45v-1,26,13,46,36,47v26,0,40,-15,40,-44v0,-32,-13,-48,-40,-48"},":":{"d":"62,-134v-17,0,-31,-14,-31,-31v0,-18,13,-32,31,-32v18,-1,33,14,32,32v0,18,-14,31,-32,31xm62,9v-17,0,-31,-15,-31,-32v0,-17,14,-32,31,-32v17,0,32,14,32,32v0,18,-15,32,-32,32","w":132},";":{"d":"62,-134v-17,0,-31,-14,-31,-31v0,-18,13,-32,31,-32v18,-1,33,14,32,32v0,18,-14,31,-32,31xm66,-49v34,1,36,47,19,72v-8,11,-23,26,-47,43r-15,-19v21,-16,32,-29,32,-38v0,-16,-23,-18,-20,-33v0,-15,15,-26,31,-25","w":132},"<":{"d":"34,-98r0,-28r140,-68r0,41r-93,41r93,42r0,40"},"=":{"d":"31,-131r0,-35r158,0r0,35r-158,0xm31,-57r0,-35r158,0r0,35r-158,0"},">":{"d":"47,-30r0,-40r92,-42r-92,-41r0,-41r140,68r0,28"},"?":{"d":"144,-204v0,58,-72,63,-57,126r-33,0v-26,-52,37,-85,47,-123v0,-31,-47,-32,-65,-9r-18,-34v38,-33,126,-20,126,40xm44,-25v0,-15,13,-29,28,-29v16,0,29,13,29,29v0,16,-14,29,-29,29v-15,0,-28,-14,-28,-29","w":157},"@":{"d":"265,-116v0,56,-55,94,-103,64v-28,23,-83,10,-83,-30v0,-30,24,-45,70,-47v-5,-26,-30,-15,-49,-6r-10,-24v38,-28,102,-14,96,45r0,38v26,16,44,-1,44,-40v0,-53,-34,-86,-88,-86v-56,0,-94,44,-94,100v0,86,104,123,158,72r0,36v-85,49,-194,-8,-194,-108v0,-76,55,-132,130,-131v76,0,123,41,123,117xm150,-105v-33,-7,-45,35,-15,38v6,0,11,-2,15,-6r0,-32","w":277},"A":{"d":"177,0r-19,-52r-88,0r-18,52r-51,0r103,-261r20,0r103,261r-50,0xm114,-182r-31,95r61,0","w":227,"k":{"y":7,"w":7,"v":7,"Y":32,"W":20,"V":27,"T":34," ":20}},"B":{"d":"200,-76v0,77,-90,81,-174,76r0,-257v87,-7,159,-10,159,63v0,20,-11,37,-33,49v32,11,48,34,48,69xm72,-221r0,62v33,4,67,-3,67,-33v0,-29,-34,-33,-67,-29xm153,-82v0,-42,-36,-44,-81,-41r0,85v45,4,81,-1,81,-44","w":214},"C":{"d":"14,-128v0,-72,48,-136,118,-134v30,0,53,6,71,18r-19,38v-53,-41,-122,7,-122,80v0,50,24,89,69,90v24,0,43,-9,57,-26r22,37v-19,20,-46,29,-82,29v-75,1,-114,-55,-114,-132","w":220},"D":{"d":"26,-257v123,-15,186,18,191,118v5,115,-71,149,-191,139r0,-257xm72,-42v65,10,98,-31,98,-94v0,-63,-37,-91,-98,-81r0,175","w":231},"E":{"d":"72,-217r0,60r85,0r0,39r-85,0r0,77r117,0r0,41r-163,0r0,-258r165,0r0,41r-119,0","w":204},"F":{"d":"72,-217r0,60r91,0r0,39r-91,0r0,118r-46,0r0,-258r170,0r0,41r-124,0","k":{"u":17,"o":17,"e":17,"a":17,"A":20,".":40,",":40}},"G":{"d":"14,-128v0,-108,119,-173,203,-109r-20,37v-52,-45,-147,-9,-135,73v-7,69,66,115,120,77r0,-50r-36,0r0,-39r82,0r0,115v-20,17,-58,28,-94,28v-75,1,-120,-55,-120,-132","w":241},"H":{"d":"175,0r0,-116r-103,0r0,116r-46,0r0,-258r46,0r0,101r103,0r0,-101r45,0r0,258r-45,0","w":246},"I":{"d":"27,0r0,-258r46,0r0,258r-46,0","w":100},"J":{"d":"168,-258v-6,112,34,268,-92,262v-42,-2,-71,-24,-73,-64r41,0v4,15,16,23,37,23v33,-1,41,-23,41,-59r0,-162r46,0","w":191},"K":{"d":"172,0r-71,-110r-29,40r0,70r-46,0r0,-258r46,0r0,124r88,-124r52,0r-81,113r96,145r-55,0","w":222},"L":{"d":"26,0r0,-258r46,0r0,217r116,0r0,41r-162,0","w":198,"k":{"y":13,"Y":27,"W":27,"V":27,"T":27," ":13}},"M":{"d":"266,0r-44,0r-27,-139r-51,143r-17,0r-52,-143r-27,139r-44,0r51,-258r25,0r55,174r55,-174r24,0","w":268},"N":{"d":"195,4r-125,-163r0,159r-44,0r0,-258r22,0r122,156r0,-156r44,0r0,262r-19,0","w":240},"O":{"d":"121,4v-74,0,-107,-58,-107,-135v-1,-70,42,-131,111,-131v76,0,115,52,114,131v-1,79,-39,136,-118,135xm125,-221v-45,1,-63,40,-63,90v0,51,14,95,59,95v51,0,71,-39,71,-95v0,-60,-22,-90,-67,-90","w":253},"P":{"d":"26,-257v95,-5,167,-6,171,75v3,66,-48,94,-125,87r0,95r-46,0r0,-257xm72,-135v43,4,78,-3,78,-44v0,-31,-36,-44,-78,-39r0,83","w":211,"k":{"o":17,"e":17,"a":17,"A":27,".":46,",":46," ":7}},"Q":{"d":"123,-262v77,0,117,53,116,132v0,62,-20,102,-60,123v14,19,59,25,92,18r0,42v-57,9,-106,-14,-127,-49v-84,14,-130,-53,-130,-134v0,-71,41,-132,109,-132xm123,-221v-46,1,-61,41,-61,91v0,47,19,94,61,95v49,0,70,-42,69,-95v0,-61,-23,-91,-69,-91","w":255},"R":{"d":"196,-184v-2,31,-23,60,-48,68r76,116r-52,0r-69,-106v-7,0,-17,-1,-29,-2r0,108r-48,0r0,-258v81,-7,176,-4,170,74xm148,-185v0,-35,-38,-35,-74,-33r0,72v41,2,74,3,74,-39","w":219,"k":{"Y":23,"W":16,"V":13,"T":15}},"S":{"d":"147,-124v51,50,10,128,-68,128v-24,0,-46,-6,-65,-18r17,-41v18,13,36,19,53,19v27,0,40,-9,40,-28v0,-65,-117,-50,-109,-129v-7,-68,99,-86,143,-52r-14,39v-26,-21,-82,-28,-84,13v-7,24,70,53,87,69","w":184},"T":{"d":"131,-217r0,217r-46,0r0,-217r-81,0r0,-41r213,0r0,41r-86,0","w":220,"k":{"y":27,"w":29,"u":33,"s":40,"r":37,"o":46,"i":13,"e":40,"c":40,"a":40,"O":21,"A":34,";":40,":":40,".":40,"-":28,",":40," ":7}},"U":{"d":"120,4v-58,0,-93,-30,-94,-85r0,-177r46,0r0,175v1,28,18,48,48,47v32,0,51,-17,52,-48r0,-174r46,0r0,178v0,54,-42,84,-98,84","w":243},"V":{"d":"122,4r-25,0r-96,-262r50,0r60,175r63,-175r49,0","w":223,"k":{"y":13,"u":19,"r":18,"o":24,"i":7,"e":20,"a":27,"A":27,";":13,":":13,".":33,"-":20,",":40}},"W":{"d":"234,4r-19,0r-56,-163r-55,163r-19,0r-84,-262r48,0r48,156r52,-156r20,0r52,156r49,-156r47,0","w":318,"k":{"y":3,"u":7,"r":7,"o":7,"e":7,"a":13,"A":20,";":7,":":7,".":30,"-":7,",":31}},"X":{"d":"166,0r-61,-93r-56,93r-48,0r77,-133r-71,-125r47,0r52,87r57,-87r48,0r-81,125r85,133r-49,0","w":216},"Y":{"d":"133,-106r0,106r-45,0r0,-106r-87,-152r48,0r61,110r62,-110r48,0","w":220,"k":{"v":20,"u":20,"q":33,"p":27,"o":33,"i":13,"e":33,"a":27,"A":32,";":23,":":20,".":46,"-":33,",":46," ":7}},"Z":{"d":"14,0r0,-15r107,-202r-105,0r0,-41r168,0r0,15r-108,202r112,0r0,41r-174,0","w":201},"[":{"d":"26,74r0,-339r92,0r0,39r-46,0r0,261r46,0r0,39r-92,0","w":144},"\\":{"d":"93,0r-94,-259r36,0r94,259r-36,0","w":127},"]":{"d":"118,74r-92,0r0,-39r47,0r0,-261r-47,0r0,-39r92,0r0,339","w":144},"^":{"d":"143,-159r-38,-63r-38,63r-34,0r63,-100r19,0r62,100r-34,0"},"_":{"d":"-1,59r0,-37r213,0r0,37r-213,0"},"`":{"d":"105,-214r-40,-51r47,0r30,51r-37,0"},"a":{"d":"183,-10v-12,24,-49,13,-55,-9v-28,40,-121,26,-117,-36v3,-54,54,-75,113,-67v5,-38,-58,-39,-84,-25r-9,-34v15,-7,33,-11,54,-11v79,0,86,53,83,134v0,25,5,42,15,48xm124,-89v-35,-7,-69,4,-69,32v0,17,10,26,30,26v33,1,42,-23,39,-58","w":191},"b":{"d":"194,-99v0,79,-75,128,-139,89r-10,14r-25,0r0,-262r44,-11r0,88v61,-33,130,14,130,82xm64,-45v35,28,94,1,85,-52v7,-51,-52,-73,-85,-46r0,98","w":209},"c":{"d":"11,-92v0,-83,96,-128,160,-81r-18,33v-35,-33,-103,-8,-96,48v-6,59,64,75,100,43r16,34v-64,43,-162,10,-162,-77","w":184},"d":{"d":"15,-91v0,-70,63,-123,130,-92r0,-75r44,-11r0,269r-44,0r0,-11v-56,39,-130,-4,-130,-80xm61,-92v-7,51,52,73,84,47r0,-98v-37,-30,-89,1,-84,51","w":209},"e":{"d":"105,-192v59,0,103,47,87,111r-135,0v-2,50,71,61,100,32r17,34v-15,13,-38,19,-69,19v-57,0,-94,-37,-94,-96v0,-56,41,-99,94,-100xm59,-114r92,0v-3,-28,-18,-41,-45,-41v-25,0,-41,13,-47,41","w":206},"f":{"d":"34,-188v0,-58,48,-92,108,-71r-13,34v-31,-14,-54,4,-52,37r39,0r0,36r-38,0r0,152r-44,0r0,-152r-28,0r0,-36r28,0","w":133},"g":{"d":"175,13v-6,70,-118,77,-165,35r27,-34v15,14,33,21,52,21v38,8,65,-38,16,-38v-35,0,-89,10,-89,-29v0,-14,13,-27,25,-31v-60,-34,-28,-129,44,-129v17,0,32,3,43,9r17,-20r30,28r-20,15v30,54,-9,126,-79,108v-8,0,-30,19,-5,19v44,-12,108,-5,104,46xm88,-156v-20,0,-34,13,-34,34v0,21,13,37,34,37v20,0,33,-16,32,-37v0,-17,-13,-34,-32,-34","w":180},"h":{"d":"68,-176v44,-36,122,-8,122,60r0,116r-44,0v-6,-58,24,-154,-40,-155v-15,0,-33,11,-38,20r0,135r-44,0r0,-258r44,-11r0,93","w":213},"i":{"d":"33,-236v0,-14,11,-25,25,-25v14,0,26,12,26,25v0,13,-13,26,-26,26v-13,0,-25,-12,-25,-26xm36,0r0,-152r-25,0r0,-36r69,0r0,188r-44,0","w":107},"j":{"d":"53,-236v0,-14,11,-25,25,-25v14,0,26,12,26,25v0,13,-13,26,-26,26v-13,0,-25,-12,-25,-26xm-2,35v40,-1,60,-5,60,-39r0,-148r-34,0r0,-36r78,0r0,184v-1,59,-40,78,-104,78r0,-39","w":132},"k":{"d":"144,0r-55,-85r-21,22r0,63r-44,0r0,-258r44,-11r0,153r62,-72r53,0r-63,71r76,117r-52,0","w":197,"k":{"a":11}},"l":{"d":"31,-258r44,-11r0,212v0,23,7,37,21,41v-16,30,-65,29,-65,-22r0,-220","w":106},"m":{"d":"167,-171v36,-39,119,-21,119,47r0,124r-44,0r0,-118v5,-44,-53,-46,-65,-18r0,136r-44,0r0,-125v2,-37,-55,-36,-65,-10r0,135r-44,0r0,-188r30,0r9,16v23,-29,82,-25,104,1","w":309},"n":{"d":"63,-171v41,-44,126,-16,126,56r0,115r-44,0v-7,-57,25,-155,-40,-155v-14,0,-31,11,-37,19r0,136r-44,0r0,-188r31,0","w":212},"o":{"d":"102,4v-58,0,-91,-41,-91,-99v0,-56,37,-98,91,-97v58,0,90,38,90,97v0,58,-33,99,-90,99xm102,-156v-31,0,-45,27,-45,61v0,41,15,63,45,63v31,0,45,-28,45,-63v0,-41,-15,-61,-45,-61","w":203},"p":{"d":"195,-93v0,74,-65,117,-131,88r0,79r-44,0r0,-262r44,0r0,12v57,-42,131,0,131,83xm149,-94v8,-56,-51,-77,-85,-48r0,99v38,23,93,2,85,-51","w":209},"q":{"d":"15,-92v0,-74,77,-127,139,-85r8,-11r28,0r0,262r-44,0r0,-79v-64,28,-131,-12,-131,-87xm146,-144v-36,-28,-92,2,-85,52v-6,53,47,71,85,49r0,-101"},"r":{"d":"133,-147v-30,-22,-65,5,-65,40r0,107r-44,0r0,-188r44,0r0,17v16,-22,58,-27,83,-14","w":153,"k":{"a":11,".":43,",":41}},"s":{"d":"144,-53v0,59,-87,71,-132,41r16,-35v16,17,67,27,70,-3v-3,-21,-16,-23,-38,-33v-32,-13,-49,-33,-49,-57v0,-55,79,-64,122,-39r-13,35v-12,-13,-62,-23,-63,5v14,35,87,30,87,86","w":155},"t":{"d":"132,-2v-45,16,-102,1,-102,-56r0,-95r-21,0r0,-35r21,0r0,-39r44,-16r0,55r52,0r0,35r-52,0v6,43,-19,119,29,119v11,0,20,-2,29,-8r0,40","w":142},"u":{"d":"68,-69v-5,52,67,39,77,10r0,-129r44,0r0,188r-44,0r0,-16v-40,34,-121,26,-121,-50r0,-122r44,0r0,119","w":212},"v":{"d":"102,4r-16,0r-85,-192r48,0r45,115r48,-115r47,0","w":189,"k":{"i":-11,".":47,",":47}},"w":{"d":"209,4r-16,0r-52,-116r-52,116r-16,0r-71,-192r47,0r37,112r46,-112r16,0r48,113r41,-113r43,0","w":282,"k":{".":35,",":35}},"x":{"d":"145,0r-49,-61r-43,61r-52,0r72,-96r-66,-92r50,0r40,57r44,-57r50,0r-72,92r79,96r-53,0","w":198},"y":{"d":"107,30v-11,27,-45,44,-84,44r0,-39v66,-1,56,-29,37,-77r-59,-146r45,0r52,130r46,-130r45,0","w":192,"k":{".":40,",":40}},"z":{"d":"11,0r0,-15r103,-135r-101,0r0,-38r165,0r0,15r-99,135r100,0r0,38r-168,0","w":190},"{":{"d":"83,6v3,32,18,34,59,34r0,34v-54,4,-104,-10,-104,-56v0,-37,39,-106,-24,-106r0,-24v59,-1,24,-63,24,-100v0,-44,51,-58,104,-53r0,32v-29,0,-63,-5,-59,27v6,43,25,82,-23,105v51,20,28,63,23,107","w":156},"|":{"d":"89,74r0,-339r36,0r0,339r-36,0"},"}":{"d":"119,-212v0,34,-35,100,23,100r0,24v-61,0,-23,70,-23,106v0,46,-51,61,-105,56r0,-34v41,0,57,-1,60,-34v1,-12,-11,-51,-11,-64v0,-17,12,-31,34,-43v-46,-23,-30,-63,-23,-105v5,-32,-31,-27,-60,-27r0,-32v53,-5,105,8,105,53","w":156},"~":{"d":"135,-84v-28,3,-65,-32,-78,0r-25,0v3,-23,15,-45,38,-47v24,-3,66,30,80,0r26,0v-8,28,-14,44,-41,47"},"\u00a0":{"w":108,"k":{"Y":7,"T":7,"A":20}}}});
