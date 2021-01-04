var $ = require('jQuery');

$('#pagination-social').twbsPagination({
    totalPages: 5,
// the current page that show on start
    startPage: 1,

// maximum visible pages
    visiblePages: 5,

    initiateStartPageClick: true,

    first: 'First',
    prev: 'Previous',
    next: 'Next',
    last: 'Last',

// carousel-style pagination
    loop: false,

// callback function
    onPageClick: function (event, page) {
        $('.page-active').removeClass('page-active');
        $('#page'+page).addClass('page-active');
    },

});

$('#pagination-economic').twbsPagination({
    totalPages: 5,
// the current page that show on start
    startPage: 1,

// maximum visible pages
    visiblePages: 5,

    initiateStartPageClick: true,

    first: 'First',
    prev: 'Previous',
    next: 'Next',
    last: 'Last',

// carousel-style pagination
    loop: false,

// callback function
    onPageClick: function (event, page) {
        $('.page-active').removeClass('page-active');
        $('#page'+page).addClass('page-active');
    },

});


$('#pagination-technical').twbsPagination({
    totalPages: 5,
// the current page that show on start
    startPage: 1,

// maximum visible pages
    visiblePages: 5,

    initiateStartPageClick: true,

    first: 'First',
    prev: 'Previous',
    next: 'Next',
    last: 'Last',

// carousel-style pagination
    loop: false,

// callback function
    onPageClick: function (event, page) {
        $('.page-active').removeClass('page-active');
        $('#page'+page).addClass('page-active');
    },

});

$('#pagination-environmental').twbsPagination({
    totalPages: 5,
// the current page that show on start
    startPage: 1,

// maximum visible pages
    visiblePages: 5,

    initiateStartPageClick: true,

    first: 'First',
    prev: 'Previous',
    next: 'Next',
    last: 'Last',

// carousel-style pagination
    loop: false,

// callback function
    onPageClick: function (event, page) {
        $('.page-active').removeClass('page-active');
        $('#page'+page).addClass('page-active');
    },

});

$('#pagination-individual').twbsPagination({
    totalPages: 5,
// the current page that show on start
    startPage: 1,

// maximum visible pages
    visiblePages: 5,

    initiateStartPageClick: true,

    first: 'First',
    prev: 'Previous',
    next: 'Next',
    last: 'Last',

// carousel-style pagination
    loop: false,

// callback function
    onPageClick: function (event, page) {
        $('.page-active').removeClass('page-active');
        $('#page'+page).addClass('page-active');
    },

});

