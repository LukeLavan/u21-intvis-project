// config
const num_strings = 4;
const num_frets = 12;

const svg_width = 1024;
const svg_height = Math.max(svg_width / num_strings, 300);

const width_string = 8;
const color_string = 'black';
const width_fret = 8;
const color_fret = 'black';

const tuning = ["G", "D#", "A#", "F"];

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
        for(let i=xmin; i<=xmax; i+=xdel){
            this.parent.append('line')
                .attr('x1',i).attr('x2',i)
                .attr('y1',ymin)
                .attr('y2',ymax)
                .style('stroke', color_fret)
                .style('stroke-width', width_fret);
        }

        // draw strings
        for(let i=ymin, j=0;i<=ymax;i+=ydel, ++j){
            this.parent.append('text')
                .attr('y',i)
                .attr('x',0)
                .text(tuning[j]);
            this.parent.append('line')
                .attr('y1',i).attr('y2',i)
                .attr('x1',xmin)
                .attr('x2',xmax)
                .style('stroke', color_string)
                .style('stroke-width',width_string);
        }
        
        // draw dots
        for(let i=0; i<this.dots.length; ++i){
            const y = this.margin.top + (this.dots[i].row+0.5)*ydel;
            const x = this.margin.left + (this.dots[i].fret+0.5)*xdel;
            this.parent.append('circle')
                .attr('cx', x).attr('cy', y)
                .attr('r',radius_dots)
                .style('fill',color_dots);
        }

        // draw notes
        for(let i=0;i<this.bools.length;++i){
            for(let j=0; j<this.bools[i].length;++j){
                if(this.bools[i][j]){
                    const y = this.margin.top + i*ydel;
                    const x = this.margin.left + (j+0.5)*xdel;
                    const note = this.notes[i][j];
                    const name = Tonal.Note.simplify(note.name);
                    this.parent.append('circle')
                        .attr('cx',x).attr('cy', y)
                        .attr('r',radius_notes)
                        .style('fill',color_notes);
                    this.parent.append('text')
                        .attr('x',x-radius_notes/4).attr('y',y+4)
                        .style('fill',color_notes_name)
                        .text(name);
                }
            }
        }
    }

    // @param note: Tonal.Note
    enableNote(note){
        const arg_name = note.chroma;
        console.log('trying to find '+arg_name);
        for(let i=0; i<this.notes.length; ++i){
            for(let j=0; j<this.notes[i].length; ++j){
                if(arg_name === this.notes[i][j].chroma){
                    this.bools[i][j] = true;
                }
            }
        }
    }

    // @param chord: Tonal.Chord
    enableChord(chord){
        chord.notes.map(d=>this.enableNote(Tonal.Note.get(d+'1'))); // arbitrary octave
    }

    // @param scale: Tonal.Scale
    enableScale(scale){
        this.enableChord(scale); // same logic, different name
    }

    clearNotes(){
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
function testScale() {
    bass.clearNotes();
    const scale = Tonal.Scale.get('c5 pentatonic');
    console.log("Enabling all notes in a "+scale.name+" scale");
    bass.enableScale(scale);
    bass.draw();
}
function testChord() {
    bass.clearNotes();
    const chord = Tonal.Chord.get('cmaj7');
    console.log('Enabling all notes in a '+chord.name+' chord');
    bass.enableChord(chord);
    bass.draw();
}
function testNote(){
    bass.clearNotes();
    const note = Tonal.Note.get('C3');
    console.log('Enabling all notes that are '+note.name+' notes');
    bass.enableNote(note);
    bass.draw();
}

// initial draw of empty fretboard
bass.draw();

const buttons = d3.select("#buttons");
const testScaleButton = buttons.append('button')
    .text("Scale")
    .on('click',testScale);
const testChordButton = buttons.append('button')
    .text('Chord')
    .on('click',testChord);
const testNoteButton = buttons.append('button')
    .text('Note')
    .on('click',testNote);