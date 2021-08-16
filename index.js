// config
const num_strings = 4;
let num_frets = 12;

const svg_width = 1024;
const svg_height = Math.max(svg_width / num_strings, 300);

const width_string = 8;
const color_string = 'black';
const width_fret = 8;
const color_fret = 'black';

const tuning = ['G2', 'D2', 'A1', 'E1'];

const dots = [
    {
        fret: 2,
        row: 1,
    },
    {
        fret: 4,
        row: 1,
    },
    {
        fret: 6,
        row: 1,
    },
    {
        fret: 8,
        row: 1,
    },
    {
        fret: 11,
        row: 0,
    },
    {
        fret: 11,
        row: 2,
    }
];
const radius_dots = 8;
const color_dots = 'grey';

const radius_notes = 24;
const color_notes = 'darkgreen';
const color_notes_name = 'white';
// end config

class BassNeck {
    constructor(parentSVG) {
        this.parent = parentSVG;
        this.width = svg_width;
        this.height = svg_height;
        this.margin = {
            top: 120,
            right: 10,
            left: 30,
            bottom: 30
        };

        // starting from the highest string, the open string of each
        this.tuning = tuning;
        this.parsedTuning = this.tuning.map(Tonal.Note.get);

        this.num_strings = num_strings;
        this.num_frets= num_frets;
        
        this.active_notes = new Map();

        // populate the note_board using the default tuning
        this.populate_note_board(tuning);

        this.dots = dots;

        this.tooltip_notes = d3.select('body').append('div').attr('class','tooltip_notes')
            .style('position','absolute')
            .style('z-index','10')
            .style('visibility','hidden')
            .style('background','#000')
            .style('color','#FFF')
            .text('note: <>');
    }

    populate_note_board(tuning=tuning){
        // the specified tuning must have the right number of open strings
        if(tuning.length!==this.num_strings){
            console.log("ERROR: invalid tuning specified (expected length "+this.num_strings+", got "+tuning.length+")");
            return;
        }
        // empty the current note_board
        this.note_board = [];
        // populate the note_board using the specified tuning
        for(let i=0; i<this.num_strings; ++i){
            const open_string = tuning[i];
            const open_string_name = Tonal.Note.simplify(open_string);
            const chrom_scale = Tonal.Scale.get(open_string_name+' chromatic');
            let note_arr = [];
            for(let j=0; j<=this.num_frets; ++j){
                note_arr.push(Tonal.Note.get(chrom_scale.notes[j%12])); // loop thru 12 notes in chromatic scale
            }
            this.note_board.push(note_arr);
        }
    }

    drawFrets(xmin,xmax,xdel,ymin,ymax,ydel){
        for(let i=xmin; i<=xmax; i+=xdel){
            this.parent.append('line')
                .attr('x1',i).attr('x2',i)
                .attr('y1',ymin)
                .attr('y2',ymax)
                .style('stroke', color_fret)
                .style('stroke-width', width_fret);
        }
    }

    drawStrings(xmin,xmax,xdel,ymin,ymax,ydel){
        for(let i=ymin, j=0;i<=ymax;i+=ydel, ++j){
            // TODO: if this note should be enabled, draw a circle behind the label
            this.parent.append('circle')
                .attr('id','openstring'+j)
                .attr('cy',i-radius_notes/2+8)
                .attr('cx',8)
                .attr('r',radius_notes)
                .attr('stroke',color_notes)
                .attr('fill','none')
                .style('opacity',0);

            // the string label
            this.parent.append('text')
                .attr('y',i)
                .attr('x',0)
                .text(this.tuning[j]);
            
            // the string itself
            this.parent.append('line')
                .attr('y1',i).attr('y2',i)
                .attr('x1',xmin)
                .attr('x2',xmax)
                .style('stroke', color_string)
                .style('stroke-width',width_string);
        }
    }

    drawDots(xmin,xmax,xdel,ymin,ymax,ydel){
        for(let i=0; i<this.dots.length; ++i){
            const y = this.margin.top + (this.dots[i].row+0.5)*ydel;
            const x = this.margin.left + (this.dots[i].fret+0.5)*xdel;
            this.parent.append('circle')
                .attr('cx', x).attr('cy', y)
                .attr('r',radius_dots)
                .style('fill',color_dots);
        }
    }

    drawNotes(xmin,xmax,xdel,ymin,ymax,ydel){
        for(let i=0;i<this.note_board.length;++i){
            // j == 0: open string
            if(this.active_notes.has(this.parsedTuning[i]))
                d3.select('#openstring'+i).style('opacity',1);

            // j > 0: the rest of the notes
            for(let j=1; j<this.note_board[i].length;++j){
                const y = this.margin.top + i*ydel;
                const x = this.margin.left + (j-0.5)*xdel;
                const note = this.note_board[i][j];
                const name = Tonal.Note.simplify(note.name);
                const is_active = this.active_notes.has(note);
                let color = color_notes;
                if(is_active) color = this.active_notes.get(note);
                const g = this.parent.append('g').attr('class','note').data([note]);

                // the circle on the fretboard
                g.append('circle')
                .attr('cx',x).attr('cy', y)
                .attr('r',radius_notes)
                .style('fill',color);

                // the text in the circle
                g.append('text')
                .attr('x',x-radius_notes/4).attr('y',y+4)
                .style('fill',color_notes_name)
                .text(name);

                // the tooltip on mouseover
                g.on('mouseover',d=>{
                    this.tooltip_notes.text('note: '+d.name);
                    return this.tooltip_notes.style('visibility','visible');
                });
                g.on('mousemove',d=>{
                    return this.tooltip_notes.style('top',d3.event.pageY-10+'px')
                        .style('left',d3.event.pageX+10+'px');
                });
                g.on('mouseout',d=>{
                    return this.tooltip_notes.style('visibility','hidden');
                });

                // click to toggle note on/off
                g.on('click',()=>{
                    if(is_active){
                        this.active_notes.delete(note);
                    } else {
                        this.active_notes.set(note,color_notes)
                    }
                    this.draw();
                });
                // use opacity instead of hidden so that the notes can still use above mouse listeners
                if(is_active){
                    g.style('opacity',1);
                } else {
                    g.style('opacity',0);
                }
            }
        }
    }

    draw(){
        // clear current state of svg first
        d3.selectAll('#fretboard > *').remove();
        const ymin = this.margin.top;
        const ymax = this.height-this.margin.bottom;
        const ydel = (ymax - ymin)/(this.num_strings-1);
        const xmin = this.margin.left;
        const xmax = this.width - this.margin.right;
        const xdel = (xmax - xmin)/this.num_frets;

        // draw frets
        this.drawFrets(xmin,xmax,xdel,ymin,ymax,ydel);

        // draw strings
        this.drawStrings(xmin,xmax,xdel,ymin,ymax,ydel);
        
        // draw dots
        this.drawDots(xmin,xmax,xdel,ymin,ymax,ydel);

        // draw notes
        this.drawNotes(xmin,xmax,xdel,ymin,ymax,ydel);
    }

    // @param note: Tonal.Note
    // @param color: string
    enableNote(note, color=color_notes){
        this.active_notes.set(note,color);
    }

    // @param chord: Tonal.Chord
    // @param octave: number
    // @param color: string
    enableChord(chord, octave, color){
        chord.notes.map(d=>this.enableNote(Tonal.Note.get(''+d+octave),color));
    }

    // @param scale: Tonal.Scale
    // @param color: string
    enableScale(scale, color){
        this.enableChord(scale,'',color); // same logic, different name
    }

    // @param tuning: string[]
    setTuning(tuning){
        this.tuning = tuning;
        this.parsedTuning = tuning.map(Tonal.Note.get);
        this.populate_note_board(this.parsedTuning);
    }

    clear(){
        this.active_notes.clear();
    }
}

// driver

let svg = d3.select('#fretboard');
if(svg.empty()){
    console.log('couldn\'t find svg!');
}
let bass = new BassNeck(svg);
// initial draw of empty fretboard
bass.draw();

// functions for testing
function testScale() {
    const scale = Tonal.Scale.get('c2 pentatonic');
    console.log('Enabling all notes in a '+scale.name+' scale');
    console.log(scale);
    bass.enableScale(scale,'red');
    bass.draw();
}

function testChord() {
    const chord = Tonal.Chord.get('cmaj7');
    console.log('Enabling all notes in a'+chord.symbol+' chord at octave 2');
    console.log(chord);
    bass.enableChord(chord,2,'blue');
    bass.draw();
}

function testNote(){
    const note = Tonal.Note.get('C3');
    console.log('Enabling all notes that are '+note.name+' notes');
    console.log(note);
    bass.enableNote(note,'green');
    bass.draw();
}

const testTunings = [tuning, ['D2','A1','E1','B0']];
const testTuningsNames = ['Standard', 'BEAD'];
function testTuning(){
    const tuningName = d3.select('#select_tuning').property('value');
    const tuning = testTunings[testTuningsNames.findIndex(d=>d===tuningName)];
    console.log('Changing tuning to '+tuningName+' ('+tuning+')');
    bass.setTuning(tuning);
    bass.draw();
}

function testClear(){
    console.log('Clearing all active notes');
    bass.clear();
    bass.draw();
}

const testFretNumOptions = [12,6];
function testFretNum(){
    const n = d3.select('#select_fretnum').property('value');
    d3.selectAll('#fretboard > *').remove();
    num_frets = n;
    bass = new BassNeck(svg);
    bass.draw();
}

// buttons that call above testing functions
const buttons = d3.select('#buttons');

const testScaleButton = buttons.append('button')
    .text('Scale')
    .on('click',testScale);

const testChordButton = buttons.append('button')
    .text('Chord')
    .on('click',testChord);

const testNoteButton = buttons.append('button')
    .text('Note')
    .on('click',testNote);

const testTuningButton = buttons.append('select')
    .attr('id','select_tuning')
    .on('change',testTuning);

testTuningButton.selectAll('option')
    .data(testTuningsNames).enter()
    .append('option')
        .text(d=>d);

const testClearButton = buttons.append('button')
    .text('Clear')
    .on('click',testClear);

const testFretNumButton = buttons.append('select')
    .attr('id','select_fretnum')
    .on('change',testFretNum);
testFretNumButton.selectAll('option')
    .data(testFretNumOptions).enter()
    .append('option').text(d=>d);
