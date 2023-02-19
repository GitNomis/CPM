let CPM = require("./build/artistoo-cjs.js")
var fs = require('fs');
var test = 'Barrier100space_50cells'
var dir = `./output/img/${test}`;

if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

/*	----------------------------------
	CONFIGURATION SETTINGS
	----------------------------------
*/
let spacing=100, nr_cells=100, radius=8, obstacles=true, cell_act=80
let sim,dim=250
let old_pix = null
let types = []
let config = {

	// Grid settings
	field_size : [dim,dim],
	
	// CPM parameters and configuration
	conf : {
		// Basic CPM parameters
		torus : [true,true],						// Should the grid have linked borders?
		seed : 1,							// Seed for random number generation.
		T : 20,								// CPM temperature
		
		// Constraint parameters. 
		// Mostly these have the format of an array in which each element specifies the
		// parameter value for one of the cellkinds on the grid.
		// First value is always cellkind 0 (the background) and is often not used.
				
		// Adhesion parameters:
		J: [[  0,	20,		0 ],
			[ 20,    0,    20 ],
			[  0, 	 0,     0 ]],
		
		// VolumeConstraint parameters
		LAMBDA_V: [0,50,50],					// VolumeConstraint importance per cellkind
		V: [0,200,100],							// Target volume of each cellkind
		
		// PerimeterConstraint parameters
		LAMBDA_P: [0,2,2],						// PerimeterConstraint importance per cellkind
		P : [0,180,36],						// Target perimeter of each cellkind
		
		// ActivityConstraint parameters
		LAMBDA_ACT : [0,200,0],			// ActivityConstraint importance per cellkind
		MAX_ACT : [0,cell_act,0],					// Activity memory duration per cellkind
		ACT_MEAN : "geometric",			// Is neighborhood activity computed as a
		// "geometric" or "arithmetic" mean?
		IS_BARRIER : [false,false,false],

	},
	
	// Simulation setup and configuration
	simsettings : {
	
		// Cells on the grid
		NRCELLS : [0,0],						// Number of cells to seed for all
		// non-background cellkinds.
		// Runtime etc
		BURNIN : 0,
		RUNTIME : 1000,
		RUNTIME_BROWSER : "Inf",
		
		// Visualization
		CANVASCOLOR : "eaecef",
		CELLCOLOR : ["000000","939393"],
		ACTCOLOR : [true,false],					// Should pixel activity values be displayed?
		SHOWBORDERS : [false,false],				// Should cellborders be displayed?
		zoom : 2,							// zoom in on canvas with this factor.
		
		// Output images
		SAVEIMG : true,					// Should a png image of the grid be saved
											// during the simulation?
		IMGFRAMERATE : 1,					// If so, do this every <IMGFRAMERATE> MCS.
		SAVEPATH : dir,	// ... And save the image in this folder.
		EXPNAME : test,					// Used for the filename of output images.
		
		
		// Output stats etc
		STATSOUT : { browser: true, node: true }, // Should stats be computed?
		LOGRATE : 10							// Output stats every <LOGRATE> MCS.

	}
}
/*	---------------------------------- */

function createObstacleGrid(gm){
	for(var i = 0; i < dim; i += spacing){
		for(var j = 0; j < dim; j += spacing){
			let k = 2
			gm.assignCellPixels( gm.makeCircle( [i,j], radius ), k )
			//cells.push(cid)
			types.push(k)
		}
	}

}

function initializeGrid(){
	if( !this.helpClasses["gm"] ){ this.addGridManipulator() }
	if(obstacles) createObstacleGrid(this.gm)
	for(var i=0; i< nr_cells;i++){
		let k = 1
		this.gm.seedCell(k)
		types.push(k)
	}
}

function logStats(){
	
	let pix=this.C.getStat( CPM.PixelsByCell )
	let centroids = this.C.getStat( CPM.CentroidsWithTorusCorrection )
	if (old_pix==null) old_pix=pix 
	for( let id of this.C.cellIDs() ){
		k = this.C.cellKind(id)
		let gained = 0
		let lost = 0
		if (k==1){
			for( let cd1 of pix[id]){
				if(!old_pix[id].some(cd2 => cd1.toString() == cd2.toString())) gained++
			}
			for( let cd1 of old_pix[id]){
				if(!pix[id].some(cd2 => cd1.toString() == cd2.toString())) lost++
			}
		}
		centroids[id][2]=gained
		centroids[id][3]=lost

	}
	old_pix=pix
	
	console.log(this.time + "\t" + JSON.stringify(centroids) )
	
}

let custommethods = {
	initializeGrid : initializeGrid,
	createObstacleGrid : createObstacleGrid,
	logStats : logStats
}
sim = new CPM.Simulation( config, custommethods )


sim.run()
console.log(types.toString())