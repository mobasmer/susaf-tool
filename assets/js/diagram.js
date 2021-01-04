const joint = require('jointjs');
let graph, points, arcs, paper, cells, thickness, center_radius, paper_size;


/**
 Sets up the paper and graph (jointjs) and draws the background.

 @param{int}        size               Diameter of the diagram.
 @param{Array}      dimension_names    Names of the dimensions.
 @param{Array}      order_names        Names of the order of effects.
 @param{Function}   deselect           Enables deselection of elements from within the diagram.
 @param{Function}   reclassify         Communicates changes in the diagram to the database.
 */

function drawDiagram(size, dimension_names, order_names, deselect, reclassify) {
    cells = {};
    graph = new joint.dia.Graph;

    paper = new joint.dia.Paper({
        el: document.getElementById('paper'),
        model: graph,
        width: size,
        height: size,
        gridSize: 5,
        drawGrid: false,
        background: {
            color: "#f8f9fc"
        },
        interactive: true
    });

    // source: https://resources.jointjs.com/tutorial/link-tools
    paper.on('link:mouseenter', function (linkView) {
        linkView.showTools();
    });

    paper.on('link:mouseleave', function (linkView) {
        linkView.hideTools();
    });

    // source:
    paper.on('element:pointerdblclick', function (cellView, cell) {
        let selectedElement = cellView.model;
        let selectedElementId = selectedElement.prop('custom/id');
        _.invoke(graph.getConnectedLinks(cell), 'remove');
        selectedElement.remove();
        delete cells[selectedElementId];
        deselect(selectedElementId);
    });

    paper.on('link:pointerdblclick', function (cellView, cell) {
        let selectedElement = cellView.model;
        selectedElement.remove();
    });

    //source: https://resources.jointjs.com/tutorial/hierarchy
    // First, unembed the cell that has just been grabbed by the user.
    paper.on('element:pointerdown', function (cellView, evt, x, y) {

        const cell = cellView.model;

        if (!cell.get('embeds') || cell.get('embeds').length === 0) {
            // Show the dragged element above all the other cells (except when the
            // element is a parent).
            cell.toFront();
        }

        if (cell.get('parent')) {
            graph.getCell(cell.get('parent')).unembed(cell);
        }
    });

// When the dragged cell is dropped over another cell, let it become a child of the
// element below.
    paper.on('element:pointerup', function (cellView, evt, x, y) {

        const cell = cellView.model;
        const cellViewsBelow = paper.findViewsFromPoint(cell.getBBox().center());

        if (cellViewsBelow.length) {
            // Note that the findViewsFromPoint() returns the view for the `cell` itself.
            const cellViewBelow = _.find(cellViewsBelow, function (c) {
                return c.model.id !== cell.id
            });

            // Prevent recursive embedding.
            if (cellViewBelow && cellViewBelow.model.get('parent') !== cell.id) {
                const parent = cellViewBelow.model;
                parent.embed(cell);

                const order = parent.prop("custom/order");
                const dimension = parent.prop("custom/dimension");
                const id = cell.prop("custom/id");

                reclassify(id, order, dimension);
            }
        }
    });

    //paper.options.connectionStrategy = joint.connectionStrategies.pinAbsolute;
    center_radius = 50;
    paper_size = size;
    const susad = describeSusAD(size, dimension_names, order_names, center_radius);
    arcs = susad.arcs;
    points = susad.points;
    graph.addCells(arcs);
}

/**
 Iteratively adds effects as elements to the diagram by "following" the consequences.

 Implemented as DSF with cycle-check from each node in the seed set selectedEffects.

 @param{Array}       selectedEffects     Effects selected by the user, serves as a "seed".
 @param{Array}       effects             Total effects.
 @param{Object}      mapping             Used to map translate dimension names to numbers.
 @param{Function}    select              Used to select effects in the table from within the diagram.
 */

function addEffects(selectedEffects, effects, mapping, select) {
    let links = new Array();
    for (let selected of selectedEffects) {
        let stack = [];

        stack.push({
            parent: null,
            effect: selected.effect,
        });

        while (stack.length) {
            let current = stack.pop();
            let id = current.effect.id;

            if (cells[id] == null) {
                let currentEffect = effects.find(element => element.effect.id == id).effect;
                let currentCell = addEffect(mapping[currentEffect.dimension], currentEffect.order, currentEffect.label, currentEffect.isPositive, id);
                cells[id] = currentCell;
                select(id);

                if (current.parent != null) {
                    links.push({source: current.parent, target: cells[id]});
                    // addLink(current.parent, cells[id]);
                }

                if (currentEffect.consequences != null) {
                    for (let consequence of currentEffect.consequences) {
                        stack.push({
                            parent: currentCell,
                            effect: consequence,
                        });
                    }
                }
            } else {
                if (current.parent != null) {
                    let outgoing = graph.getNeighbors(current.parent, {outbound: true});

                    if (!outgoing.includes(cells[id])) {
                        //addLink(current.parent, cells[id])
                        links.push({source: current.parent, target: cells[id]});
                    }
                }
            }
        }
    }

    for (let link of links) {
        addLink(link.source, link.target);
    }
}

/**
 Adds all the selected effects (and only those) plus the links between them as elements to the diagram.

 This function is also used to update the diagram.

 @param{Array}  selectedEffects   Effects selected by the user, serves as a "seed".
 @param{Array}  effects           Total effects.
 @param{Object} mapping           Used to translate dimension names to numbers.
 */

function addSelectedEffectsOnly(selectedEffects, effects, mapping) {
    let cellsIds = Object.keys(cells);
    let links = new Array();

    for (let selected of selectedEffects) {
        let id = selected.effect.id;
        let currentEffect = effects.find(element => element.effect.id == id).effect;

        if (cells[id] == null) {
            let currentCell = addEffect(mapping[currentEffect.dimension], currentEffect.order, currentEffect.label, currentEffect.isPositive, id);
            cells[id] = currentCell;
            addNeighborsToNewNode(currentEffect.consequences, currentCell, selectedEffects, effects, mapping, true, links);
            addNeighborsToNewNode(currentEffect.causes, currentCell, selectedEffects, effects, mapping, false, links);
        } else {
            const equal = (element) => id == parseInt(element);
            let index = cellsIds.findIndex(equal);
            cellsIds.splice(index, index + 1);


            addNeighborsToExistingNode(currentEffect.consequences, cells[id], selectedEffects, effects, mapping, true, links);
            addNeighborsToExistingNode(currentEffect.causes, cells[id], selectedEffects, effects, mapping, false, links);
        }
    }

    for (let link of links) {
        addLink(link.source, link.target);
    }

    for (let id of cellsIds) {
        _.invoke(graph.getConnectedLinks(cells[id]), 'remove');
        cells[id].remove();
        delete cells[id];
    }
}

/**
 Adds neighbors to the given node.

 This function is used if the node has not been created directly before calling this function, thus it needs to consider
 whether links already exist.

 @param{Array}                 lst                 Contains ids of related effects.
 @param{Element}               cell                Cell representing an effect.
 @param{Array}                 selectedEffects     Effects selected by the user, serves as a "seed".
 @param{Array}                 effects             Total effects.
 @param{Object}                mapping             Used to map translate dimension names to numbers.
 @param{boolean}               outgoing            Determines whether we are looking at consequences or causes.
 @param{Array}                 links               Collection of the links.
 */

function addNeighborsToExistingNode(lst, cell, selectedEffects, effects, mapping, outgoing, links) {
    if (lst != null) {
        let neighbors = outgoing ? links.filter(c => c.source.cid == cell.cid) : links.filter(c => c.target.cid == cell.cid);
        let graphNeighbors = outgoing ? graph.getNeighbors(cell, {outbound: true}) : graph.getNeighbors(cell, {inbound: true});

        for (let item of lst) {
            /* cause / consequence has also been selected */
            if (selectedEffects.some(element => element.effect.id == item.id)) {
                /* corresponding cell has not been created yet ? */
                let isNeighbor = outgoing ? (c => cells[item.id].cid == c.target.cid) : (c => cells[item.id].cid == c.source.cid);

                if (cells[item.id] == null) {
                    let neighborEffect = effects.find(element => element.effect.id == item.id).effect;
                    let neighborCell = addEffect(mapping[neighborEffect.dimension], neighborEffect.order, neighborEffect.label, neighborEffect.isPositive, item.id);
                    cells[item.id] = neighborCell;
                    /* link between cause / consequence und effect in question exists? */
                } else if (neighbors.some(isNeighbor) || graphNeighbors.some(c => c.cid == cells[item.id].cid)) {
                    continue;
                }

                if (outgoing) {
                    //addLink(cell, cells[item.id]);
                    links.push({source: cell, target: cells[item.id]});
                } else {
                    //addLink(cells[item.id], cell);
                    links.push({source: cells[item.id], target: cell});
                }
            }
        }
    }
}

/**
 Adds neighbors to the given node.

 This function is used if the node has been created directly before calling this function, thus it does not need to consider
 whether links already exist.

 @param{Array}                lst                 Contains ids of related effects.
 @param{Element}              cell                Cell representing an effect.
 @param{Array}                selectedEffects     Effects selected by the user, serves as a "seed".
 @param{Array}                effects             Total effects.
 @param{Object}               mapping             Dictionary used to map translate dimension names to numbers.
 @param{boolean}              outgoing            Determines whether we are looking at consequences or causes.
 @param{Array}                links               Collection of the links to be generated.
 */

function addNeighborsToNewNode(lst, cell, selectedEffects, effects, mapping, outgoing, links) {
    if (lst != null) {
        for (let item of lst) {
            if (selectedEffects.some(element => element.effect.id == item.id)) {
                if (cells[item.id] == null) {
                    let neighborEffect = effects.find(element => element.effect.id == item.id).effect;
                    let neighborCell = addEffect(mapping[neighborEffect.dimension], neighborEffect.order, neighborEffect.label, neighborEffect.isPositive, item.id);
                    cells[item.id] = neighborCell;
                }

                if (outgoing) {
                    //addLink(cell, cells[item.id]);
                    links.push({source: cell, target: cells[item.id]});
                } else {
                    //addLink(cells[item.id], cell);
                    links.push({source: cells[item.id], target: cell});
                }
            }
        }
    }
}

/**
 * Adds a link between two given nodes.
 *
 * @param{Element}    source    Source node of the link.
 * @param{Element}    target    Target node of the link.
 */

function addLink(source, target) {
    let link = new joint.shapes.standard.Link();
    link.source(source, {
        anchor: {
            name: 'modelCenter',
        },
        connectionPoint:{
            name: 'bbox'
        }
    });
    link.target(target, {
        anchor: {
            name: 'perpendicular'
        },
        connectionPoint: {
            name: 'boundary',
        }
    });
    link.router('manhattan', {
        maxAllowedDirectionChange: 270,
        step: 5,
    });
    link.connector('rounded', {
        radius: 20,
    });
    link.addTo(graph);
    addToolViewToLink(link);
}


/**
 Adds tool views to a link.

 For example, tool views are added to remove or to move a link.

 @param{shapes.standard.Link}     link
 */

function addToolViewToLink(link) {
    let verticesTool = new joint.linkTools.Vertices();
    let segmentsTool = new joint.linkTools.Segments();
    let sourceArrowheadTool = new joint.linkTools.SourceArrowhead();
    let targetArrowheadTool = new joint.linkTools.TargetArrowhead();
    //let sourceAnchorTool = new joint.linkTools.SourceAnchor();
    //let targetAnchorTool = new joint.linkTools.TargetAnchor();
    let boundaryTool = new joint.linkTools.Boundary();
    let removeButton = new joint.linkTools.Remove();

    let toolsView = new joint.dia.ToolsView({
        tools: [
            verticesTool, segmentsTool,
            sourceArrowheadTool, targetArrowheadTool,
            //sourceAnchorTool, targetAnchorTool,
            boundaryTool, removeButton
        ]
    });


    let linkView = paper.findViewByModel(link);
    linkView.addTools(toolsView);
    linkView.hideTools();
}

/**
 Builds the diagram, i.e. the background incl. labels of the dimensions and orders of effects

 @param{int}        size               Diameter of the diagram.
 @param{Array}      dimension_names    Names of the dimensions.
 @param{Array}      order_names        Names of the order of effects.
 @param{int}        center_radius      Radius of the "inner" circle of the diagram.
 */

function describeSusAD(size, dimension_names, order_names, center_radius) {
    let arcs = [];
    let points_of_arcs = [];
    let number_of_orders = order_names.length;
    let number_of_dimensions = dimension_names.length;
    let radius = size / 2 - 20;
    let angle = 360 / number_of_dimensions;
    thickness = (radius - center_radius) / number_of_orders;
    let center = {
        x: size / 2,
        y: size / 2,
    };

    for (let dim_angle = 0; dim_angle < 360; dim_angle += angle) {
        for (let i = 1; i <= number_of_orders; ++i) {
            const dimension_number = dim_angle / angle;
            const color = assignColor(i);

            const radius = i * thickness + center_radius;
            const result = createArc(center, radius, thickness, dim_angle, angle, color);
            const arc = result.arc;
            const points = result.points;
            points_of_arcs.push(points);

            arc.prop('custom/order', i.toString(10));
            arc.prop('custom/dimension', dimension_number.toString(10));

            if (i == 3 && Array.isArray(dimension_names)) {
                let dimension_name = dimension_names[dimension_number];
                addDimensionLabel(angle, radius, dimension_name, dimension_number, points);
            }

            if (dim_angle == 360 - angle) {
                let order_name = order_names[i - 1];
                addOrderLabel(points, i, order_name);
            }

            arcs.push(arc);
        }
    }

    return {
        arcs: arcs,
        points: points_of_arcs,
    }
}

/**
 *      Creates an arc which denotes a specific order of effect in a dimension.
 *
 * @param center                   Center point (x,y)
 * @param radius                   Radius of the diagram.
 * @param thickness                Thickness of the resulting arc.
 * @param dim_angle                Angle where the arc starts in the diagram.
 * @param angle                    Size of the angle for each arc.
 * @param color                    Color of the arc.
 * @returns {{arc: shapes.standard.Path, points: {start: {x: number, y: number}, end2: {x: number, y: number}, end: {x: number, y: number}, start2: {x: number, y: number}}}}
 */
function createArc(center, radius, thickness, dim_angle, angle, color) {
    let arc = new joint.shapes.standard.Path();
    let d = describeArcFromOrigin(center.x, center.y, radius, thickness, dim_angle, dim_angle + angle);
    let points = computeArcPoints(center.x, center.y, radius, thickness, dim_angle, dim_angle + angle);
    arc.removeAttr("body/refD");
    arc.attr("body/d", d);
    arc.attr("body/fill", color);
    arc.attr("body/fill-opacity", "0.8");
    arc.attr("body/stroke", "DarkSlateGrey");
    arc.attr("body/stroke-opacity", "0.8");
    arc.attr("body/stroke-width", "1.5");
    arc.attr({body: {style: {'pointer-events': 'none'}}});
    arc.resize(100, 100);
    arc.position(points.start.x, points.start.y);

    return {
        arc: arc,
        points: points,
    };
}

/**
    Assigns a color to each annulus that represents the order of effect.
 **/
function assignColor(i) {
    let color;

    switch (i) {
        case 1:
            color = '#fbfaf5';
            break;
        case 2:
            color = '#f1f1f1';
            break;
        case 3:
            color = '#e9e9e9';
            break;
        default:
            color = '#e9e9e9';
    }

    return color;
}

/**
 * Adds the dimension label to the SusAD background on top of the corresponding dimension segment
 * @param angle                 Angle used to describe an arc.
 * @param radius                Radius of arc.
 * @param dimension_name        Name of the dimension.
 * @param dimension_number      Number of the dimension.
 * @param points                Starting and end points of the arc.
 */
function addDimensionLabel(angle, radius, dimension_name, dimension_number, points) {
    let largeArcFlag = angle <= 180 ? "0" : "1";
    let d = ["M", points.end.x - points.start.x, points.end.y - points.start.y,
        "A", radius, radius, 0, largeArcFlag, 1, 0, 0,
        "Z"].join(" ");
    let id = "p" + dimension_number;
    let offset = '20%';

    addTextPath(d, id, dimension_name, points, offset);
}

/**
 * Adds the label for the order of effect as svg path
 * @param points        Starting and ending points used to describe an arc.
 * @param i             Number of the order.
 * @param order_name    Label of the order in question.
 */

function addOrderLabel(points, i, order_name) {
    let d = ["M", points.end.x - points.start.x, points.end.y - points.start.y,
        "L", points.end2.x - points.start.x, points.end2.y - points.start.y,
        "Z"].join(" ");
    let id = "o" + i;
    let offset = '1%';

    addTextPath(d, id, order_name, points, offset);
}

/**
 Aligns a text to a given path.

 @param{String}     d                  SVG path.
 @param{String}     id                 Id assigned to path element and to be referenced by the textpath element.
 @param{String}     textContent        Textual content of the text path.
 @param{Object}     points             Actual position of the corresponding arc.
 @param{String}     offset             Offset of the text on the path.

 */

function addTextPath(d, id, textContent, points, offset) {
    let svg = document.getElementsByTagName("svg")[0];
    let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    let text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    let textPath = document.createElementNS("http://www.w3.org/2000/svg", "textPath");
    let g = document.createElementNS("http://www.w3.org/2000/svg", "g");

    // Use path.setAttribute("<attr>", "<value>"); to set any attributes you want

    path.setAttribute("d", d);
    path.setAttribute("id", id);
    path.setAttribute("style", "stroke: none; fill: none");
    path.setAttribute('transform', 'translate(' + points.start.x + ',' + points.start.y + ')');
    svg.appendChild(path);

    g.setAttribute('fill', '#000000');
    let gElement = svg.appendChild(g);

    text.setAttribute('font-size', '20');
    text.setAttribute("fill", "darkslategray");
    //text.setAttribute('width', '200');
    let textElement = gElement.appendChild(text);

    textPath.setAttribute("href", "#" + id);
    //textPath.setAttribute("style", "text-anchor: middle;");
    textPath.setAttribute("startOffset", offset);
    textPath.textContent = textContent;
    textElement.appendChild(textPath);
}

/**
 Adds an effect as an element to the diagram (graph).

 @param{int}        dimension             Number referring to the corresponding dimension.
 @param{int}        order                 Number referring to the corresponding order of effect.
 @param{String}     label                 Textual content of the element.
 @param{boolean}    isPositive            Whether the effective is positive or not.
 @param{int}        id                    Offset of the text on the path.
 */

function addEffect(dimension, order, label, isPositive, id) {
    let color, width = 100, height = 40;
    if (isPositive) {
        color = '#FFFFC7';
    } else {
        color = '#ACD7EC'
    }

    let effect = new joint.shapes.standard.TextBlock();

    effect.attr('body/strokeWidth', 3);
    effect.attr('body/rx', 5);
    effect.attr('body/ry', 5);
    effect.attr('body/fill', color);
    effect.attr('label/text', label);
    effect.attr('label/style/color', 'black');
    effect.attr('label/style/fontSize', 14);
    effect.attr('label/style/fontFamily', '\'Roboto Condensed\', sans-serif');
    effect.attr('label/style/fontWeight', 400);
    effect.prop('custom/id', id);
    let index = dimension * 3 + order - 1;
    effect.resize(width, 40);
    let arc = arcs[index];
    let point = points[index];
    effect.addTo(graph);
    arc.embed(effect);
    let positioned_effect = positionEffect(effect, order, dimension * 72, (dimension + 1) * 72);
    return positioned_effect;
}


/* Functions to compute Arc path
* https://stackoverflow.com/questions/5736398/how-to-calculate-the-svg-path-for-an-arc-of-a-circle
* */

/**
 Describes the arc for use in svg.

 @param{int}        cx             Point on x-axis.
 @param{int}        cy             Point on y-axis.
 @param{int}        radius         Radius of the diagram.
 @param{int}        thickness      Thickness of the resulting arcs.
 @param{int}        start_angle    Angle where the arc starts in the diagram.
 @param{int}        end_angle      Angle where the arc ends in the diagram.

 */

function describeArc(cx, cy, radius, thickness, start_angle, end_angle) {

    let start = polarToCartesian(cx, cy, radius, end_angle);
    let end = polarToCartesian(cx, cy, radius, start_angle);
    let largeArcFlag = end_angle - start_angle <= 180 ? "0" : "1";

    let cutout_radius = radius - thickness;
    let start2 = polarToCartesian(cx, cy, cutout_radius, end_angle);
    let end2 = polarToCartesian(cx, cy, cutout_radius, start_angle);


    return ["M", start.x, start.y,
        "L", start2.x, start2.y,
        "A", cutout_radius, cutout_radius, 0, largeArcFlag, 0, end2.x, end2.y,
        "L", end.x, end.y,
        "A", radius, radius, 0, largeArcFlag, 1, start.x, start.y,
        "Z"
    ].join(" ");
}

/**
 Computes the four corners of the arc.

 @param{int}        cx              Point on x-axis.
 @param{int}        cy              Point on y-axis.
 @param{int}        radius          Radius of the outer circle.
 @param{int}        cutout_radius.  Radius of the inner circle.
 @param{int}        start_angle     Angle where the arc starts in the diagram.
 @param{int}        end_angle       Angle where the arc ends in the diagram.

 */

function computeArcPoints(cx, cy, radius, cutout_radius, start_angle, end_angle) {
    return {
        start: polarToCartesian(cx, cy, radius, end_angle),
        end: polarToCartesian(cx, cy, radius, start_angle),

        start2: polarToCartesian(cx, cy, cutout_radius, end_angle),
        end2: polarToCartesian(cx, cy, cutout_radius, start_angle),
    }
}

/**
 Describes the arc for use in svg, with (0,0) as center point.

 @param{int}        cx             Point on x-axis.
 @param{int}        cy             Point on y-axis.
 @param{int}        radius         Radius of the diagram.
 @param{int}        thickness      Thickness of the resulting arcs.
 @param{int}        start_angle    Angle where the arc starts in the diagram.
 @param{int}        end_angle      Angle where the arc ends in the diagram.

 */

function describeArcFromOrigin(cx, cy, radius, thickness, start_angle, end_angle) {
    let cutout_radius = radius - thickness;
    let points = computeArcPoints(cx, cy, radius, cutout_radius, start_angle, end_angle);
    let largeArcFlag = end_angle - start_angle <= 180 ? "0" : "1";

    return ["M", 0, 0,
        "L", points.start2.x - points.start.x, points.start2.y - points.start.y,
        "A", cutout_radius, cutout_radius, 0, largeArcFlag, 0, points.end2.x - points.start.x, points.end2.y - points.start.y,
        "L", points.end.x - points.start.x, points.end.y - points.start.y,
        "A", radius, radius, 0, largeArcFlag, 1, 0, 0,
        "Z"
    ].join(" ");
}

function positionEffect(effect, order, start_angle, end_angle) {
    const position = getRandomPosition(order, start_angle, end_angle);
    effect.position(position.x - 50, position.y - 20);
    return effect;
}

/**
 *
 * @param order             order of effect indicates the circular segment in question.
 * @param start_angle       starting angle of the arc.
 * @param end_angle         end angle of the arc.
 * @returns {{x: number, y: number}}
 */
function getRandomPosition(order, start_angle, end_angle) {
    const angle = getRandomInt(start_angle + 5, end_angle - 5);
    const min_radius = center_radius + (order - 1) * thickness + 10;
    const max_radius = center_radius + order * thickness - 10;
    const radius = getRandomInt(min_radius, max_radius);

    const x = radius * Math.cos(degrees_to_radians(angle - 90)) + paper_size / 2;
    const y = radius * Math.sin(degrees_to_radians(angle - 90)) + paper_size / 2;

    return {
        x: x,
        y: y
    }
}

function degrees_to_radians(degrees) {
    const pi = Math.PI;
    return degrees * (pi / 180);
}

/**
 Transforms polar coordinates to cartesian coordinates.

 @param{int}        centerX         Point on the x-axis.
 @param{int}        centerY         Point on the y-axis.
 @param{int}        radius
 @param{int}        angleInDegrees

 */
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    let angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;

    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
}

/**
    Computes a random integer value between min and max.
 */

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

exports.describeSusAD = describeSusAD;
exports.addEffect = addEffect;
exports.drawDiagram = drawDiagram;
exports.addEffects = addEffects;
exports.addSelectedEffectsOnly = addSelectedEffectsOnly;