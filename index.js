// config
const num_strings = 4;
const num_frets = 12;

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

        this.bools = [];
        this.notes = [];
        for(let i=0; i<num_strings; ++i){
            const open_string = this.parsedTuning[i];
            const open_string_name = Tonal.Note.simplify(open_string.name);
            const chrom_scale = Tonal.Scale.get(open_string_name+' chromatic');
            let bool_arr = [];
            let note_arr = [];
            for(let j=0; j<num_frets; ++j){
                bool_arr.push(false);
                note_arr.push(Tonal.Note.get(chrom_scale.notes[(j+1)%num_frets]));
            }
            this.bools.push(bool_arr);
            this.notes.push(note_arr);
        }

        this.dots = dots;

        this.tooltip_notes = d3.select('body').append('div').attr('class','tooltip_notes')
            .style('position','absolute')
            .style('z-index','10')
            .style('visibility','hidden')
            .style('background','#000')
            .style('color','#FFF')
            .text('note: <>');
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
            this.parent.append('text')
                .attr('y',i)
                .attr('x',0)
                .text(this.tuning[j]);
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
        for(let i=0;i<this.bools.length;++i){
            for(let j=0; j<this.bools[i].length;++j){
                const y = this.margin.top + i*ydel;
                const x = this.margin.left + (j+0.5)*xdel;
                const note = this.notes[i][j];
                const name = Tonal.Note.simplify(note.name);
                const g = this.parent.append('g').attr('class','note').data([note]);

                // the circle on the fretboard
                g.append('circle')
                    .attr('cx',x).attr('cy', y)
                    .attr('r',radius_notes)
                    .style('fill',note.color?note.color:color_notes);
                // the text in the circle
                g.append('text')
                    .attr('x',x-radius_notes/4).attr('y',y+4)
                    .style('fill',color_notes_name)
                    .text(name);
                // the tooltip on mouseover
                g.on('mouseover',d=>{
                    this.tooltip_notes.text('note: '+d.name);
                    //console.log(d);
                    return this.tooltip_notes.style('visibility','visible');
                });
                g.on('mousemove',d=>{
                    return this.tooltip_notes.style('top',d3.event.pageY-10+'px')
                        .style('left',d3.event.pageX+10+'px');
                });
                g.on('mouseout',d=>{
                    return this.tooltip_notes.style('visibility','hidden');
                });
                g.on('click',()=>{
                    this.bools[i][j]=!this.bools[i][j];
                    this.draw();
                });
                if(this.bools[i][j]){
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
    enableNote(note, color){
        const arg_name = note.name;
        console.log('trying to find '+arg_name);
        for(let i=0; i<this.notes.length; ++i){
            for(let j=0; j<this.notes[i].length; ++j){
                if(arg_name === this.notes[i][j].name){
                    this.bools[i][j] = true;
                    if(color)
                        this.notes[i][j].color=color;
                }
            }
        }
    }

    // @param chord: Tonal.Chord
    // @param color: string
    enableChord(chord, color){
        chord.notes.map(d=>this.enableNote(Tonal.Note.get(d+'1'),color)); // arbitrary octave
    }

    // @param scale: Tonal.Scale
    // @param color: string
    enableScale(scale, color){
        this.enableChord(scale,color); // same logic, different name
    }

    // @param tuning: string[]
    setTuning(tuning){
        // save currently activated notes and their color
        let prev_notes = [];
        for(let i=0;i<this.bools.length;++i)
            for(let j=0;j<this.bools[i].length;++j)
                if(this.bools[i][j])
                    prev_notes.push(this.notes[i][j]);
        this.clearBools(); // de-activate all notes

        // build tuning and this.notes from arg
        this.tuning = tuning;
        this.notes = []; // clears old this.notes
        this.parsedTuning = tuning.map(Tonal.Note.get);
        for(let i=0; i<num_strings; ++i){
            const open_string = this.parsedTuning[i];
            const open_string_name = Tonal.Note.simplify(open_string.name);
            const chrom_scale = Tonal.Scale.get(open_string_name+' chromatic');
            let note_arr = [];
            for(let j=0; j<num_frets; ++j){
                note_arr.push(Tonal.Note.get(chrom_scale.notes[(j+1)%num_frets]));
            }
            this.notes.push(note_arr);
        }

        // re-activate previous notes
        prev_notes.map(d=>this.enableNote(d,d.color), this);

    }

    clearBools(){
        for(let i=0;i<this.bools.length; ++i){
            for(let j=0; j<this.bools[i].length; ++j){
                this.bools[i][j] = false;
            }
        }
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
    bass.clearBools();
    const scale = Tonal.Scale.get('c5 pentatonic');
    console.log('Enabling all notes in a '+scale.name+' scale');
    bass.enableScale(scale,'red');
    bass.draw();
}

function testChord() {
    bass.clearBools();
    const chord = Tonal.Chord.get('cmaj7');
    console.log('Enabling all notes in a '+chord.name+' chord');
    bass.enableChord(chord,'blue');
    bass.draw();
}

function testNote(){
    bass.clearBools();
    const note = Tonal.Note.get('C3');
    console.log('Enabling all notes that are '+note.name+' notes');
    bass.enableNote(note,'green');
    bass.draw();
}

const testTunings = [tuning, ['D2','A1','E1','B0']];
const testTuningsNames = ['Standard', 'BEAD'];
function testTuning(){
    const tuningName = d3.select('select').property('value');
    const tuning = testTunings[testTuningsNames.findIndex(d=>d===tuningName)];
    console.log('Changing tuning to '+tuningName+' ('+tuning+')');
    bass.setTuning(tuning);
    bass.draw();
}

function testClear(){
    bass.clearBools();
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
    .attr('class','select')
    .on('change',testTuning);

testTuningButton.selectAll('option')
    .data(testTuningsNames).enter()
    .append('option')
        .text(d=>d);

const testClearButton = buttons.append('button')
    .text('Clear')
    .on('click',testClear);
