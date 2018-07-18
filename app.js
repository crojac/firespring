/*
 * @summary Firespring test application.
 * @author Jeff Pabian <pabian.jeff@gmail.com>
 * @version 1.0
 * @date 17 JUL 2018
 *
 */

const express    = require('express');
const axios      = require('axios');
const path       = require('path');
const arraySort  = require('array-sort');
const natCompare = require('string-natural-compare');
const buildURL   = require('build-url'); 

const app     = express();
app.set( 'view engine', 'ejs');
app.set( 'views', path.join(__dirname, 'views'));
app.listen( 3000 , () => console.log('Listening on PORT 3000') );

/*
 *
 * This code is written for the specification. It is not extensible.
 *
 */

/*
 * @summary Normalize data object based on the functions interal specification.
 * @param{Object}  data - A data object
 * @return{Object} data   
 *
 */
function normalize_data(data)
{
    data.forEach( function(obj) { 
        obj.mass   = obj.mass.replace( ',', '' ); 
        obj.height = obj.height.replace( ',', '' );
    });
    return data;
}

/*
 * @summary Custom compare on property a name.
 * @param{string} prop - The property to sort by
 * @return{string} - sorted value
 *
 */
function custom_compare(prop)
{
    return function ( a, b ) { 
        return natCompare( a[prop], b[prop] );
    }
}

/*
 * @summary Creates pagination links object.
 *
 * @param{string} route   - The req.path  
 * @param{string} sort_by - The req.query.sort  
 * @param{string} pg      - The req.query.pg  
 * 
 * @return{Object} links - A link object 
 *
 */
function buildPaginationLinks(route,sort,pg)
{
    max_pg = 5;
    min_pg = 1;
    links  = {};

    pg   = parseInt(pg);
    sort = ( sort ) ? sort : '' ;

    //Increment, decrement, set max, min bounds (circular)
    next_pg = ( pg ) ? ( ( ( pg + 1 ) > max_pg || pg < min_pg ) ? min_pg : pg + 1 ): '' ;
    prev_pg = ( pg ) ? ( ( ( pg - 1 ) < min_pg || pg > max_pg ) ? max_pg : pg - 1 ): '' ;

    links.prev    = buildURL( null, { path : route, queryParams : { sort : sort, pg : prev_pg } } );
    links.next    = buildURL( null, { path : route, queryParams : { sort : sort, pg : next_pg } } );

    return links;
}

/*
 *
 * @summary Remove a set of data from an array/object. 
 * 
 * @param{Array} all_results - Array/object of data results.
 * @param{string} pg - The data set (10 results) to return based on pg number supplied.
 *
 * @return{Array} - A slice of the array. 
 *
 */   
function sliceData( all_results, pg )
{

    if ( pg === undefined ){ pg = 0; }

    switch(parseInt(pg))
    {
        case 1: 
            return all_results.slice(0,10);
        case 2: 
            return all_results.slice(10,20);
        case 3: 
            return all_results.slice(20,30);
        case 4: 
            return all_results.slice(30,40);
        case 5: 
            return all_results.slice(40,50);
        default:
            return all_results; 
    }

}

/*
 *
 * Render index/root of application with links for tests
 *
 */
app.get( '/', function (req, res) {
    res.render('index', { } );
})

/*
 *
 * Service route 'character/:name'
 * Returns a character, characters or nothing from swapi.co base on name supplied
 *
 */ 
app.get( '/character/:name', function (req, res) {

    links = {};
    links.display = 0;

    if ( req.params.name )
    {
        api_url  = 'https://swapi.co/api/people/?search=' + req.params.name;
        axios.get(api_url)
        .then ( response => { res.render('character', { 'data' : response.data.results, 'links' : links } ); })
        .catch( error    => { res.send('API error') } )

    }else{

        res.render('URL Argument error');

    }
})

/*
 *
 * Serivce route '/characters' 
 * Return 50 characters from swapi.co
 * Sort and paginate if req.query.sort and req.query.pg exists 
 *
 */
app.get( '/characters/', function (req, res) {

        route   = req.path;
        sort_by = req.query.sort         ||'name';
        pg      = parseInt(req.query.pg) || null;

        axios.all([
            axios.get('https://swapi.co/api/people?page=1'),
            axios.get('https://swapi.co/api/people?page=2'),
            axios.get('https://swapi.co/api/people?page=3'),
            axios.get('https://swapi.co/api/people?page=4'),
            axios.get('https://swapi.co/api/people?page=5'),
        ])
        .then( axios.spread( ( res1, res2, res3, res4, res5, res6, res7 ) => {

            all_results = res1.data.results.concat(
                 res2.data.results
                ,res3.data.results
                ,res4.data.results
                ,res5.data.results
            ); 

            // Normalize and perform natural sort on data  
            arraySort( normalize_data(all_results), custom_compare(sort_by) );

            // Get a slice of the data for pagination purposes 
            data = sliceData( all_results, pg );

            // Create Pagination Links
            links = buildPaginationLinks(route,sort_by,pg);

            if ( pg ){ links.display = 1; } 
            res.render( 'character', { 'data': data, 'links': links } ); 

        }))
        .catch( 
            err => { res.send('API Error'); }
        );
    

})

/*
 *
 * Service route '/planet-residents' 
 * Return a JSON object of residents keyed by planet
 *
 */

app.get( '/planet-residents/', function (req, res) {

        axios.all([
             axios.get('https://swapi.co/api/planets?page=1')
            ,axios.get('https://swapi.co/api/planets?page=2')
            ,axios.get('https://swapi.co/api/planets?page=3')
            ,axios.get('https://swapi.co/api/planets?page=4')
            ,axios.get('https://swapi.co/api/planets?page=5')
            ,axios.get('https://swapi.co/api/planets?page=6')
            ,axios.get('https://swapi.co/api/planets?page=7')
            ,axios.get('https://swapi.co/api/people?page=1')
            ,axios.get('https://swapi.co/api/people?page=2')
            ,axios.get('https://swapi.co/api/people?page=3')
            ,axios.get('https://swapi.co/api/people?page=4')
            ,axios.get('https://swapi.co/api/people?page=5')
            ,axios.get('https://swapi.co/api/people?page=6')
            ,axios.get('https://swapi.co/api/people?page=7')

        ])
        .then( axios.spread( ( p1, p2, p3, p4, p5, p6, p7, 
                               c1, c2, c3, c4, c5, c6, c7 ) => {

            var all_planets = p1.data.results.concat(
                  p2.data.results
                 ,p3.data.results
                 ,p4.data.results
                 ,p5.data.results
                 ,p6.data.results
                 ,p7.data.results
            ); 

            var all_characters = c1.data.results.concat(
                  c2.data.results
                 ,c3.data.results
                 ,c4.data.results
                 ,c5.data.results
                 ,c6.data.results
                 ,c7.data.results
            ); 

            var data = {}; 

            for( var i = 0; i < all_planets.length; i++ )
            {
                data[all_planets[i].name] = [];

                for( var j = 0; j < all_characters.length; j++ )
                {
                    if ( all_planets[i].url == all_characters[j].homeworld )
                    {
                        data[all_planets[i].name].push( all_characters[j].name ); 
                    }
                }

            }

            res.send(data);

        }))
        .catch( 
            err => { res.send('API Error'); }
        );

})

function getCharacters(pg)
{
    url = 'https://swapi.co/api/people?page=' + pg ;
    return axios.get(url); 
}

function getPlanets(pg)
{
    url = 'https://swapi.co/api/planets?page=' + pg ;
    return axios.get(url); 
}

app.get('/extensible-residents', async function( req, res ){

        json_data  = {};
        characters = [];
        planets    = [];

        // NOT DRY

        i    = 1 
        next = 1;
        do{
            response = await getCharacters(i).catch( err => { res.send('API Error'); } );
            Array.prototype.push.apply( characters, response.data.results); 
            if ( ! response.data.next ) { break; }
            i++;
        }while( next )

        j    = 1
        next = 1;
        do{
            response = await getPlanets(j).catch( err => { res.send('API Error'); } );
            Array.prototype.push.apply( planets, response.data.results); 
            if ( ! response.data.next ){ break; }
            j++;
        }while( next )

        for( var i = 0; i < planets.length; i++ )
        {
            json_data[planets[i].name] = [];
            for( var j = 0; j < characters.length; j++ )
            {
                if ( planets[i].url == characters[j].homeworld )
                {
                    json_data[planets[i].name].push( characters[j].name ); 
                }
            }
        }

        res.send(json_data);

}); 

