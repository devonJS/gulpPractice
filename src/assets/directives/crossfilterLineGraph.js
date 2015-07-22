/**
 * Created by devon on 7/14/15.
 */
(function(){
    'use strict';

    angular.module('bsApp').directive('crossfilterLineGraph', [

        function() {
            return {
                restrict: "E",
                scope: {
                    data: '=',
                    trendingPoints: '=?',
                    options: '=?',
                    pointselect: '&',
                    brushing: '&'
                },
                template: "<div><button ng-click='day()'>Day</button><button ng-click='threeDay()'>Three Days</button><button ng-click='week()'>Week</button><button ng-click='twoWeeks()'>Two Weeks</button><button ng-click='month()'>Month</button></div>",
                link: function(scope, element, attrs) {
                    scope.options = scope.options || {};
                    scope.trendingPoints = scope.trendingPoints || {};
                    scope.options.width = scope.options.width || 900;
                    scope.options.height = scope.options.height || 450;
                    scope.options.margins = scope.options.margins || 40;

                    scope.$watch('data', function(data) {
                        draw();
                    });

                    var minGraph = 0;
                    var maxGraph = d3.max(scope.data, function(d) {
                        return d.y;
                    });

                    var xGraph = d3.time.scale().range([0, scope.options.width - scope.options.margins * 2]).domain([scope.data[0].x, scope.data[scope.data.length - 1].x]);
                    var yGraph = d3.scale.linear().range([scope.options.height - scope.options.margins * 2, 0]).domain([minGraph, maxGraph]);

                    function draw() {
                        //Initial chart set-up
                        d3.select('.zoomed').remove();
                        var min = 0;
                        var max = d3.max(scope.data, function(d) {
                            return d.y;
                        });

                        var x = d3.time.scale().range([0, scope.options.width - scope.options.margins * 2]).domain([scope.data[0].x, scope.data[scope.data.length - 1].x]);
                        var y = d3.scale.linear().range([scope.options.height - scope.options.margins * 2, 0]).domain([min, max]);

                        var yAxisGroup = null;
                        var xAxisGroup = null;
                        var maxDataPointsForDots = 10;
                        var transitionDuration = 1000;
                        var pointRadius = 4;
                        var t = null;
                        var dataLinesGroup = null;
                        var dataCirclesGroup = null;

                        var xAxis = d3.svg.axis().scale(x).orient('bottom');
                        var yAxis = d3.svg.axis().scale(y).orient("left");

                        scope.svg = d3.select(element[0])
                            .append('svg')
                            .attr('width', scope.options.width)
                            .attr('height', scope.options.height)
                            .append('svg:g')
                            .attr('transform', 'translate(' + scope.options.margins + "," + scope.options.margins + ')');

                        t = scope.svg.transition().duration(transitionDuration);

                        if(!yAxisGroup) {
                            yAxisGroup = scope.svg.append('svg:g')
                                .attr('class', 'yTick')
                                .call(yAxis);
                        }
                        else {
                            t.select('.yTick').call(yAxis);
                        }

                        if(!xAxisGroup) {
                            xAxisGroup = scope.svg.append('svg:g')
                                .attr('class', 'xTick')
                                .attr('transform', 'translate(0,' + 372 + ')')
                                .call(xAxis);
                        }
                        else {
                            t.select('.xTick').call(xAxis);
                        }

                        //Start d3 brush
                        scope.brush = d3.svg.brush()
                            .x(x)
                            .extent([new Date(2014, 0, 1), new Date(2014, 0, 8)])
                             //.on('brush', brushed)
                            .on('brushend', brushEnded);

                        var context = scope.svg.append('g')
                            .attr('class', 'context');

                        context.append("g")
                            .attr("class", "x brush")
                            .call(scope.brush)
                            .selectAll("rect")
                            .attr("height", scope.options.height - 78);

                        // Draw the lines
                        if (!dataLinesGroup) {
                            dataLinesGroup = scope.svg.append('svg:g');
                        }

                        var dataLines = dataLinesGroup.selectAll('.data-line')
                            .data([scope.data]);

                        var line = d3.svg.line()
                             //assign the X function to plot our line as we wish
                            .x(function(d,i) {
                                return x(d.x);
                            })
                            .y(function(d) {
                                return y(d.y);
                            })
                            .interpolate("linear");

                        dataLines
                            .enter()
                            .append('svg:path')
                                .attr('class', 'area');
                        dataLines.enter().append('path')
                            .attr('class', 'data-line')
                            .style('opacity', 0.3)
                            .attr('d', line(scope.data));

                        dataLines.transition()
                            .attr('d', line)
                                .duration(transitionDuration)
                                .style('opacity', 1)
                                .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

                        dataLines.exit()
                            .transition()
                            .attr('d', line)
                            .duration(transitionDuration)
                            .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(0) + ")"; })
                            .style('opacity', 1e-6)
                            .remove();

                        if(!dataCirclesGroup) {
                            dataCirclesGroup = scope.svg.append('svg:g');
                        }

                        var circles = dataCirclesGroup.selectAll('.data-point')
                            .data(scope.trendingPoints);
                        var circleCounter = -1;

                        circles
                            .enter()
                                .append('svg:circle')
                                    .attr('class', 'data-point')
                                    .style('opacity', 1e-6)
                                    .style('cursor', 'pointer')
                                    .attr('circleCount', function() { circleCounter++; return circleCounter;})
                                    .attr('cx', function(d) { return x(d.x);})
                                    .attr('cy', function(d) { return y(0);})
                                    .attr('r', function() { return (scope.trendingPoints.length <= maxDataPointsForDots) ? pointRadius : 0;})
                                    .on('click', function(d) {scope.pointselect({x: d.x, y: d.y}); d3.event.stopPropagation();})
                                .transition()
                                .duration(transitionDuration)
                                    .style('opacity', 1)
                                    .attr('cx', function(d) { return x(d.x);})
                                    .attr('cy', function(d) { return y(d.y);});

                        circles
                            .transition()
                            .duration(transitionDuration)
                            .attr('cx', function(d) { return x(d.x);})
                            .attr('cy', function(d) {return y(d.y);})
                            .attr('r', function() { return (scope.trendingPoints.length <= maxDataPointsForDots) ? pointRadius : 0;})
                            .style('opacity', 1);

                        circles
                            .exit()
                                .transition()
                                .duration(transitionDuration)
                                // Leave the cx transition off. Allowing the points to fall where they lie is best.
                                //.attr('cx', function(d, i) { return xScale(i) })
                                .attr('cy', function() { return y(0);})
                                .style('opacity', 1e-6)
                                .remove();
                    }
                    function getDates(x1, x2) {
                        x1 = xGraph.invert(x1);
                        x2 = xGraph.invert(x2);
                        scope.brushing({x1: x1, x2: x2});
                    }
                    function parseXAxis(x1, x2) {
                        //Parse out the x-axis points
                        x1 = x1.replace('translate(', '');
                        x2 = x2.replace('translate(', '');
                        var x1Comma = x1.indexOf(',');
                        var x2Comma = x2.indexOf(',');
                        x1 = x1.slice(0, x1Comma);
                        x2 = x2.slice(0, x2Comma);

                        //Convert x-axis points back to dates
                        getDates(parseFloat(x1), parseFloat(x2));
                    }

                    function brushEnded() {
                        var beginningX = d3.select('.resize.w').attr('transform');
                        var endX = d3.select('.resize.e').attr('transform');
                        parseXAxis(beginningX, endX);
                    }

                    function redrawBrush(extent) {
                        scope.svg.select('.x.brush').remove();
                        scope.brush = d3.svg.brush()
                            .x(xGraph)
                            .extent(extent)
                            .on('brushend', brushEnded);

                        var context = scope.svg.append('g')
                            .attr('class', 'context');

                        context.append("g")
                            .attr("class", "x brush")
                            .call(scope.brush)
                            .selectAll("rect")
                            .attr("height", scope.options.height - 78);

                        brushEnded();
                    }
                    scope.day = function() {
                        var extent1 = scope.brush.extent();
                        redrawBrush([new Date(extent1[0].getFullYear(), extent1[0].getMonth(), extent1[0].getDate()), new Date(extent1[0].getFullYear(), extent1[0].getMonth(), extent1[0].getDate() + 1)]);
                    };

                    scope.threeDay = function() {
                        var extent1 = scope.brush.extent();
                        redrawBrush([new Date(extent1[0].getFullYear(), extent1[0].getMonth(), extent1[0].getDate()), new Date(extent1[0].getFullYear(), extent1[0].getMonth(), extent1[0].getDate() + 3)]);
                    };

                    scope.week = function() {
                        var extent1 = scope.brush.extent();
                        redrawBrush([new Date(extent1[0].getFullYear(), extent1[0].getMonth(), extent1[0].getDate()), new Date(extent1[0].getFullYear(), extent1[0].getMonth(), extent1[0].getDate() + 7)]);
                    };

                    scope.twoWeeks = function() {
                        var extent1 = scope.brush.extent();
                        redrawBrush([new Date(extent1[0].getFullYear(), extent1[0].getMonth(), extent1[0].getDate()), new Date(extent1[0].getFullYear(), extent1[0].getMonth(), extent1[0].getDate() + 14)]);
                    };

                    scope.month = function() {
                        var extent1 = scope.brush.extent();
                        redrawBrush([new Date(extent1[0].getFullYear(), extent1[0].getMonth(), extent1[0].getDate()), new Date(extent1[0].getFullYear(), extent1[0].getMonth() + 1, extent1[0].getDate())]);
                    };

                }
            };
        }
    ]);
})();
