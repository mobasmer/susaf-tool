/*
 * Welcome to your app's main JavaScript file!
 *
 * We recommend including the built version of this JavaScript file
 * (and its CSS file) in your base layout (base.html.twig).
 */

// any CSS you import will output into a single css file (app.css in this case)
import 'jointjs/css/layout.css';
import 'jointjs/css/themes/modern.css';
import 'datatables.net-dt/css/jquery.dataTables.min.css';
import 'bootstrap/scss/bootstrap.scss';
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'datatables.net-select-dt/css/select.dataTables.min.css';
import 'datatables.net-buttons-dt/css/buttons.dataTables.min.css';
import '../css/sb-admin-2.css';
import '../css/multiple-step-form.css';
import '../css/pagination.css';
import '../css/custom.css';
import '../css/app.css';


// Need jQuery? Install it with "yarn add jquery", then uncomment to import it.
//import $ from 'jquery';

var $ = require('jquery');
require('popper.js');
require('bootstrap');
var lodash = require('lodash');
var backbone = require('backbone');
var joint = require('jointjs');
const dagre = require('dagre');
const graphlib = require('graphlib');
var susad = require('./diagram');
var svg2png = require('save-svg-as-png');
require('datatables.net-select-dt');
require('jszip');
require('./jquery.twbsPagination');
require('./paging');
var sbadmin = require('./sb-admin-2.js');
var pdfMake = require('pdfmake/build/pdfmake');
require('datatables.net-dt');
require('datatables.net-buttons-dt');
require('datatables.net-buttons/js/buttons.colVis.js');
require('datatables.net-buttons/js/buttons.flash.js');
require('datatables.net-buttons/js/buttons.html5.js');
require('datatables.net-buttons/js/buttons.print.js');
var pdfFonts = require('pdfmake/build/vfs_fonts');
pdfMake.vfs = pdfFonts.pdfMake.vfs;


var table;

$(document).ready(function () {
    let paper, graph;
    /**
     *  Initialise DataTable
    **/

    table = $('#effects-table').DataTable({
        dom: '<lf><B>rt<ip>',
        ajax: {
            url: '/susaf/effects/load_effects',
            type: 'GET',
            xhrFields: {
                withCredentials: true
            }
        },
        rowId: function(e) {
            return 'effect_' + e.effect.id;
        },
        // Define the columns of the table.
        columns: [
            {
                data: null,
                defaultContent: '',
            },
            { data: 'effect.id'},
            {
                data: 'effect.label',
                // shorten the label if it is too long to be displayed properly
                render:  {
                    "display": function ( data, type, row, meta ) {
                        return data.length > 20 ?
                            '<span title="'+data+'">'+data.substr( 0, 24 )+'...</span>' :
                            data;
                    }
                }
            },
            {
                // map database abbreviation to the name for display
                data: 'effect',
                render: {
                    "_": function(effect){
                        let dbDimension = effect.dimension;
                        let viewDimension;
                        switch (dbDimension.toLowerCase()) {
                            case 'soc':
                                viewDimension = 'Social';
                                break;
                            case 'ind':
                                viewDimension = 'Individual';
                                break;
                            case 'env':
                                viewDimension = 'Environmental';
                                break;
                            case 'eco':
                                viewDimension = 'Economic';
                                break;
                            case 'tec' :
                                viewDimension = 'Technical';
                                break;
                            default:
                                viewDimension = dbDimension;
                        }

                        return viewDimension;
                    }
                }},
            {
                // map database abbreviation to the name for display
                data: 'effect',
                render: {
                    '_': function(effect){
                        let dbOrder = effect.order;
                        let viewOrder;

                        switch (dbOrder) {
                            case 1:
                                viewOrder= 'Direct';
                                break;
                            case 2:
                                viewOrder = 'Indirect';
                                break;
                            case 3:
                                viewOrder = 'Systemic';
                                break;
                            default:
                                viewOrder = dbOrder;
                        }

                        return viewOrder;
                    }
                }

            },
            {
                // map database abbreviation to the name for display
                data: 'effect',
                render: {
                    '_': function(effect){
                        let dbPositive = effect.isPositive;
                        let viewPositive;
                        switch (dbPositive) {
                            case true:
                                viewPositive = 'Positive';
                                break;
                            case false:
                                viewPositive = 'Negative';
                                break;
                            default:
                                viewPositive = dbPositive;
                        }

                        return viewPositive
                    }
                }
            },
            {
                data: 'effect.note',
                render:  {
                    "display": function ( data, type, row, meta ) {
                        return data.length > 20 ?
                            '<span title="'+data+'">'+data.substr( 0, 24 )+'...</span>' :
                            data;
                    }
                }
            },
            {
                // Add edit and delete buttons to each row
                data: null,
                'defaultContent':  '<button class="btn btn-secondary edit-row" data-toggle="modal" data-target="#editEffectModal"><i class="fa fa-edit"></i></button>' +
                '<button class="btn btn-danger delete-row ml-2"><i class="fa fa-trash"></i></button>',
             }
        ],
        // Define whether the columns shall be visible, sortable, searchable, etc.
        columnDefs: [
            {
            orderable: false,
            className: 'select-checkbox',
            targets: 0
            },
            {
                "targets": [ 1 ],
                "visible": false,
                "searchable": false
            }],
        select: {
            style: 'multi',
            selector: 'td:first-child'
        },
        order: [[1, 'asc']],
        // add buttons for extra functionality
        buttons: [
            {
                extend: 'selectAll',
                text: '<i class="fas fa-check-square"></i> Select All'
            },
            {
                extend: 'selectNone',
                text: '<i class="far fa-square"></i> Deselect items'
            },
            {
                extend: 'pdf',
                text: '<i class="fas fa-file-pdf"></i> PDF',
                exportOptions: {
                    columns: [1, 2, 3, 4, 5,6],
                }
            },
            {
                extend: 'csv',
                text: '<i class="fas fa-file-csv"></i> CSV',
                exportOptions: {
                    columns: [1, 2, 3, 4, 5,6],
                }
            },
            {
                extend: 'print',
                text: '<i class="fas fa-print"></i> Print',
                autoPrint: false
            }
        ],
        'fnInitComplete': function(){
            let selects = $('.select-relations');
            for(let sel of selects){
                addOptions(this.api().rows().data(), sel);
            }
        },
    });

    /**
    *  Deletes selected row
    **/

    $('#effects-table').on('click', '.delete-row', function (e) {
        let delRow = table
            .row($(this).parents('tr'));
        let id = delRow.data()['effect'].id;

        if(confirm("Are you sure you want to delete this effect: " + delRow.data()['effect'].label + "?")){
            $.ajax(this.href, {
                type: 'post',
                data: {
                    '_method': 'delete',
                    'id': id,
                },
                complete: function (jqXHR, textStatus) {
                    if (textStatus == "success") {
                        table.ajax.reload();
                        $('.select-relations option[value=\"' + id + '\"]').remove();
                    }
                },
            });
        }
    });

    $("#menu-toggle").click(function(e) {
        e.preventDefault();
        $("#" +
            "wrapper").toggleClass("toggled");
    });

    /**
    *  Saves changes for selected effect
    **/
    $('#save-edit').on('click', function(e){
        e.preventDefault(); // avoid to execute the actual submit of the form.

        let form = $('#edit-effect-form');
        let url = form.attr('action');
        let elems = form.serializeArray();
        let id = form.data("effect-id");
        let causes = collect('#edit-effect-causes');
        let consequences = collect('#edit-effect-consequences');

        let causesIds = [];
        let consequencesIds = [];

        causes.forEach(function(item, index){
            causesIds.push(item.id);
        });

        consequences.forEach(function(item, index){
            consequencesIds.push(item.id);
        });

        //source: https://stackoverflow.com/questions/45470802/how-to-pass-along-csrf-token-in-an-ajax-post-request-for-a-form
        let token =  $('#edit-effect-form > input[name="token"]').attr('value');
        $.ajaxSetup({
            beforeSend: function(xhr) {
                xhr.setRequestHeader('X-CSRF-Token', token);
            }
        });

        $.ajax(url, {
            type: "POST",
            data: {
                description: elems[0].value,
                dimension: elems[1].value,
                order_of_effect: elems[2].value,
                is_positive: elems[3].value,
                note: elems[4].value,
                id: id,
                causes: causesIds,
                consequences: consequencesIds,
            }, // serializes the form's elements.
            complete: function (jqXHR, textStatus) {
                if (textStatus == "success") {
                    table.ajax.reload();
                    $('.select-relations option[value=\"' + id + '\"]').text(elems[0].value);
                    $("#edit_alert_placeholder").empty();
                    showalert("#edit_alert_placeholder","The changes have been saved.", "alert-success");
                }
            },
            error: function(jqHXR, textStatus){
                $("#edit_alert_placeholder").empty();
                showalert("#edit_alert_placeholder", "The changes couldn't be saved. Please try again.", "alert-danger");
            }
        });
    });

    /**
    *  Shows data for selected effect.
    **/

    $('#effects-table').on('click', '.edit-row', function () {
        let data = table
            .row($(this).parents('tr')).data();

       if(data.effect.isPositive){
           $('#effect-positive-modal').prop('checked', true);
       } else {
           $('#effect-negative-modal').prop('checked', true);
       }

        $('#effect-label-modal').val(data.effect.label);
        $('#dimension-effect-modal').val(data.effect.dimension);
        $('#order-effect-modal').val(data.effect.order);
        $('#effect-description-modal').val(data.effect.note);
        $('#edit-effect-form').data('effect-id', data.effect.id);

        let causes = data.effect.causes;
        let opts = document.getElementById("edit-effect-causes").options;
        markSelected(opts, causes);
        let consequences = data.effect.consequences;
        opts = document.getElementById('edit-effect-consequences').options;
        markSelected(opts, consequences);
    });

    /**
    *  Deletes selected rows
    **/

    $('#delete-selected').on('click', function () {
        let data = table
            .rows('.selected').data();
        let labels = [];
        data.each(function(value, index){
            labels.push(value.effect.label);
        });

        if(labels.length && confirm("Are you sure you want to delete these effects: " + labels.toString() + "?")){
            let ids = [];

            data.each(function(value, index){
                ids.push(value.effect.id);
            })

            $.ajax(this.href, {
                type: 'post',
                data: {
                    '_method': 'deleteSelected',
                    'ids': ids,
                },
                complete: function (jqXHR, textStatus) {
                    if (textStatus == "success") {
                        table.ajax.reload();

                        for(let id of ids){
                            $('.select-relations option[value=\"' + id + '\"]').remove();
                        }
                    }
                },
            });
        }

        if(!labels.length){
            alert("No effects selected!");
        }
    });

    /**
    * Saves a new effect.
    **/
    $("#form-add-effect").submit(function (e) {

        e.preventDefault(); // avoid to execute the actual submit of the form.

        var form = $(this);
        var url = form.attr('action');
        var elems = form.serializeArray();
        let causes = collect('#add-effect-causes');
        let consequences = collect('#add-effect-consequences');

        let causesIds = [];
        let consequencesIds = [];

        causes.forEach(function(item, index){
            causesIds.push(item.id);
        });

        consequences.forEach(function(item, index){
            consequencesIds.push(item.id);
        });

        prepareAjaxRequest('#form-add-effect > input[name="token"]');
        //source: https://stackoverflow.com/questions/45470802/how-to-pass-along-csrf-token-in-an-ajax-post-request-for-a-form

        $.ajax(url, {
            type: "POST",
            data: {
                description: elems[0].value,
                dimension: elems[1].value,
                order_of_effect: elems[2].value,
                is_positive: elems[3].value,
                note: elems[4].value,
                causes: causesIds,
                consequences: consequencesIds,
            }, // serializes the form's elements.

            complete: function (jqXHR, textStatus) {
                if (textStatus == "success") {
                    $("#create_alert_placeholder").empty();
                    showalert("#create_alert_placeholder", "The effect has been created successfully!", "alert-success")
                    $("#form-add-effect")[0].reset();
                    let id = jqXHR.responseText;
                    table.ajax.reload();
                    $('.select-relations').append('<option value="'+ id + '">'+ elems[0].value+'</option>');
                }
            },

            error: function(jqHXR, textStatus){
                $("#create_alert_placeholder").empty();
                showalert("#create_alert_placeholder", "The effect couldn't be saved. Please try again.", "alert-danger")
            }
        });

    });

    /**
     *  Resets forms when closing them
     **/

     $('#cancel-add-effect').on('click', function () {
         $('#form-add-effect')[0].reset();
         $("#alertdiv").alert('close');
     });

    $('.cancel-edit-effect').on('click', function () {
        $('#edit-effect-form')[0].reset();
        $("#alertdiv").alert('close');
    });


    /**
     * Download SusAD as a PNG file.
     **/
    $('#dl').on('click', function(){

        /* Based on library: save-svg-to-png
        *
        * TODO: implement without external library
        */

        svg2png.saveSvgAsPng(document.getElementsByTagName("svg")[0], "diagram.png", {
            encoderOptions: 1,
            excludeUnusedCss: true,
            backgroundColor: "white",
        });
    });

    /**
    *  Create a SusAD for the selected effects.
    **/

     $('#create-chains').on('click', function(){
         let mapping = {
             'ind': 0,
             'tec': 1,
             'eco': 2,
             'env': 3,
             'soc': 4
         };
         let selectedEffects = table.rows({ selected: true }).data().toArray();
         let effects = table.rows().data().toArray();

         if(selectedEffects.length == 0){
             alert("No effects selected for visualization! Please select at least one effect to be included in the SusAD.");
             return;
         }

         $("#susaf-effects").hide();
         $("#susad").show();

         susad.drawDiagram(1000, ['Individual', 'Technical', 'Economic', 'Environmental', 'Social'], ['Direct', 'Indirect', 'Systemic'], function(id){
             table.rows(['#effect_'+id]).deselect();
         }, reclassify);
         susad.addEffects(selectedEffects, effects, mapping, function(id){
             table.rows(['#effect_'+id]).select();
         });

         //$("#susaf-effects").hide();
         //$("#susad").show();
    });

    $('#show-selected').on('click', function(){
        const mapping = {
            'ind': 0,
            'tec': 1,
            'eco': 2,
            'env': 3,
            'soc': 4
        };
        const selectedEffects = table.rows({ selected: true }).data().toArray();
        const effects = table.rows().data().toArray();

        if(selectedEffects.length == 0){
            alert("No effects selected for visualization! Please select at least one effect to be included in the SusAD.");
            return;
        }

        $("#susaf-effects").hide();
        $("#susad").show();

        susad.drawDiagram(1000, ['Individual', 'Technical', 'Economic', 'Environmental', 'Social'], ['Direct', 'Indirect', 'Systemic'], function(id){
            table.rows(['#effect_'+id]).deselect();
        }, reclassify);
        susad.addSelectedEffectsOnly(selectedEffects, effects, mapping);

       // $("#susaf-effects").hide();
        //$("#susad").show();
    });

    $("#back-to-table").on('click', function(){
        if($("#update-diagram").css('display') == 'none'){
            $('#update-diagram').show();
        }

        $("#susaf-effects").show();
        $("#susad").hide();
    });

    /**
     * Update already existent diagram while preserving the layout etc.)
     **/

    $('#update-diagram').on('click', function(){
        let mapping = {
            'ind': 0,
            'tec': 1,
            'eco': 2,
            'env': 3,
            'soc': 4
        };
        let selectedEffects = table.rows({ selected: true }).data().toArray();
        let effects = table.rows().data().toArray();

        susad.addSelectedEffectsOnly(selectedEffects, effects, mapping);

        $("#susaf-effects").hide();
        $("#susad").show();
    });
});

/**
 * Adds options (effects) to the multi-select fields (used to link effects)
 *
 * @param data
 * @param sel
 */
function addOptions(data, sel) {
    if (data.length) {
        data.each(function (elem) {
            addOption(elem, sel);
        });
    }
}

function addOption(elem, sel){
    let opt = document.createElement('option');
    opt.value = elem.effect.id;
    opt.innerHTML = elem.effect.label;
    sel.appendChild(opt);
}

/**
 * Collects the selected option in one of the multi-select fields used to link effects.
 * @param id
 * @returns {[]}
 */
function collect(id){
    let selected = [];
    $(id + ' option:selected').each(function(index, elem){
        selected.push({
            id: $(elem).val(),
            label: $(elem).text(),
        })
    });
    console.log(selected);
    return selected;
}

function markSelected(opts, sel){
    for (var j = 0; j < sel.length; j++) {
        for (var i = 0; i < opts.length; i++) {
            if (opts[i].value == sel[j].id) {
                opts[i].selected = true;
                break;
            }
        }
    }
}

/**
 * Shows an alert for a limited time.
 *
 * @param id
 * @param message
 * @param alerttype
 */
function showalert(id, message,alerttype) {

    $(id).append('<div id="alertdiv" class="alert ' +  alerttype + ' fade show"><a class="close" data-dismiss="alert">×</a><span>'+message+'</span></div>')

    setTimeout(function() { // this will automatically close the alert and remove this if the users doesnt close it in 5 secs
        $("#alertdiv").alert('close')
    }, 5000);
}

/**
 * Adds CSRF token to request header.
 * source: https://stackoverflow.com/questions/45470802/how-to-pass-along-csrf-token-in-an-ajax-post-request-for-a-form
 *
 * @param{string} selector
 */

function prepareAjaxRequest(selector){
    let token =  $(selector).attr('value');
    $.ajaxSetup({
        beforeSend: function(xhr) {
            xhr.setRequestHeader('X-CSRF-Token', token);
        }
    });
}

/**
 * Assigns a new dimension and / or dimension to an effect.
 *
 * @param{String} id
 * @param{String} order
 * @param{String} dimension
 */
function reclassify(id, order, dimension){
    const url = '/susaf/effects/update_position';
    const row = table.row("#effect_"+id);
    const data = row.data();
    const mapping = ['ind','tec','eco','env','soc'];
    const mapped_dimension = mapping[dimension];

    console.log(mapped_dimension);

    console.log("mapped_dimension " + mapped_dimension);
    console.log("data dimension: " + data.effect.dimension);
    console.log("order " + order);
    console.log("data order: " + data.effect.order);

    if(mapped_dimension != data.effect.dimension || order != data.effect.order) {

        $.ajax(url, {
            type: "POST",
            data: {
                id: id,
                dimension: mapped_dimension,
                order_of_effect: order,
            },

            complete: function (jqXHR, textStatus) {
                if (textStatus == "success") {
                    $("#update_alert_placeholder").empty();
                    showalert("#update_alert_placeholder", "The new classification has been saved!", "alert-success")
                    table.ajax.reload();
                }
            },

            error: function (jqHXR, textStatus) {
                $("#update_alert_placeholder").empty();
                showalert("#update_alert_placeholder", "The new classification could not be saved. Please try to again or use the table view to adapt the classification.", "alert-danger")
            }
        });
    }
}