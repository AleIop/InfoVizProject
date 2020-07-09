// Declare model
const model = new Model();

// Initialize controllers
new Filters(model, document.body.querySelector('#filters'));
new SidebarController(model, document.body.querySelector('#sidebar'));


$(document).ready( function() {
  // Initialize visualizations
  var mapController = new MapController(model, document.body.querySelector('#geoMap'));
  var treeMapController = new TreeMapController(model, document.body.querySelector('#treeMap'));

  // Change visualization handler
  document.querySelector('.switch-to-map').onclick = () => switchTo('map');
  document.querySelector('.switch-to-treemap').onclick = () => switchTo('treeMap');
});

// Function for changing visualization
function switchTo(visualization) {
  document.body.querySelector('#geo-map').classList.add('d-none');
  document.body.querySelector('#tooltip').classList.add('d-none');
  // document.body.querySelector('#world-map').classList.add('d-none');
  document.body.querySelector('#timeGraph').classList.add('d-none');
  document.body.querySelector('#treeMap').classList.add('d-none');

  switch(visualization) {
  case 'map':
    document.body.querySelector('#geo-map').classList.remove('d-none');
    document.body.querySelector('#tooltip').classList.remove('d-none');
    // document.body.querySelector('#world-map').classList.remove('d-none');
    document.body.querySelector('#timeGraph').classList.remove('d-none');
    break;
  case 'treeMap':
    document.body.querySelector('#treeMap').classList.remove('d-none');
    break;
  }
}
