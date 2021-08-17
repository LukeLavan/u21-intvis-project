// defaults
const num_strings = 4;
let num_frets = 12;

const svg_width = 1024;
const svg_height = Math.max(svg_width / num_strings, 300);

const width_string = 3;
const color_string = 'black';
const width_fret = 8;
const color_fret = 'silver';
const color_fret_outline = 'black'

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
const color_dots_outline = 'black';

const radius_notes = 24;
const color_notes = 'brown';
const color_notes_name = 'white';
const color_notes_outline = 'black';

const color_background = 'lightyellow';

const color_tooltip_background = 'black';
const color_tooltip_text = 'white';
// end defaults

class fretboard {
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
            .style('background',color_tooltip_background)
            .style('color',color_tooltip_text)
            .text('note: <>');

	// store user selected note, default value null is checked to determine if notes can be selected (one note at a time)
	// resets to null when active notes are reset using the clear button
	this.selected_note = null;
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
            let chrom_scale = Tonal.Scale.get(open_string_name+' chromatic');
            let note_arr = [];
            let octave_count = 0;
            for(let j=0; j<=this.num_frets; ++j){
                // we need more than one octave of notes if this.num_frets >= 12
                // therefore, replace the chrom_scale with higher octaves when necessary
                if(j !== 0 && j % 12 === 0){
                    let octave = open_string_name.replace(/\D/g,''); // strip all non-numbers
                    octave = parseInt(octave) + 1; // convert to string, add one to get next octave up
                    const base_note = open_string_name.replace(/[0-9]/g, ''); // strip all numbers
                    const next_note = base_note + octave; // string concatenation
                    chrom_scale = Tonal.Scale.get(next_note+' chromatic'); // replace chromatic scale with new one (one octave higher) 
                    ++octave_count; // keep track of how high up we're going
                    // console.log('needed another octave to fill string; starting again from '+next_note);
                }
                // j-12*octave_count is always bounded by 0 and 11 inclusive
                note_arr.push(Tonal.Note.get(chrom_scale.notes[j-12*octave_count])); 
            }
            this.note_board.push(note_arr);
        }
    }

    drawFrets(xmin,xmax,xdel,ymin,ymax,ydel){
        for(let i=xmin,j=0; i<=xmax; i+=xdel,++j){
            // outline of fret
            this.parent.append('line')
                .attr('x1',i).attr('x2',i)
                .attr('y1', ymin - 12)
                .attr('y2', ymax + 12)
                .style('stroke',color_fret_outline)
                .style('stroke-width', width_fret+3);

            // inside of fret
            this.parent.append('line')
                .attr('x1',i).attr('x2',i)
                .attr('y1',ymin-10)
                .attr('y2',ymax+10)
                .style('stroke', color_fret)
                .style('stroke-width', width_fret);
            
            // fret labels
            if(j!==0){
                this.parent.append('text')
                    .attr('x', i-5)
                    .attr('y', ymax + 28)
                    .text(j);
            }
        }

        // baseline
        this.parent.append('line')
            .attr('x1', xmin)
            .attr('x2', xmin)
            .attr('y1', ymin - 10)
            .attr('y2', ymax + 10)
            .style('stroke', color_fret_outline)
            .style('stroke-width', width_fret);
    }

    drawStrings(xmin,xmax,xdel,ymin,ymax,ydel){
        for(let i=ymin, j=0;i<=ymax;i+=ydel, ++j){
            // TODO: if this note should be enabled, draw a circle behind the label
            this.parent.append('circle')
                .attr('id','openstring'+j)
                .attr('cy',i-radius_notes/2+8)
                .attr('cx',11)
                .attr('r',radius_notes/2)
                .attr('stroke',color_string)
                .attr('fill','none')
                .style('opacity',0);

            // the string label
            this.parent.append('text')
                .attr('y',i)
                .attr('x',2)
                .attr('font-size','15px')
                .text(this.tuning[j]);
            
            // the string itself
            this.parent.append('line')
                .attr('y1',i).attr('y2',i)
                .attr('x1',xmin)
                .attr('x2',xmax+10)
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
                .style('fill',color_dots)
                .style('stroke', color_dots_outline);
        }
    }

    drawBackground(xmin, xmax, ymin, ymax){
        this.parent.append('rect')
            .attr('x',xmin)
            .attr('width', xmax-xmin)
            .attr('y', ymin)
            .attr('height', ymax-ymin)
            .attr('fill', color_background);
    }

    drawNotes(xmin,xmax,xdel,ymin,ymax,ydel){
        for(let i=0;i<this.note_board.length;++i){
            // j === 0: open string
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
		if (note == this.selected_note) color = color_notes;
                const g = this.parent.append('g').attr('class','note').data([note]);

                // the circle on the fretboard
                g.append('circle')
                    .attr('cx',x).attr('cy', y)
                    .attr('r',radius_notes)
                    .style('stroke',color_notes_outline)
                    .style('fill',color);

                // the text in the circle
                g.append('text')
                    .attr('x',x).attr('y',y+3)
                    .attr('text-anchor', 'middle')
                    .style('fill',color_notes_name)
                    .text(name);

                // mouseover tooltip only shows for inactive notes
                if(!is_active){
                    g.on('mouseover',d=>{
                        this.tooltip_notes.text(d.name);
                        return this.tooltip_notes.style('visibility','visible');
                    });
                    g.on('mousemove',d=>{
                        return this.tooltip_notes.style('top',d3.event.pageY-10+'px')
                            .style('left',d3.event.pageX+10+'px');
                    });
                    g.on('mouseout',d=>{
                        return this.tooltip_notes.style('visibility','hidden');
                    });
                }

                // click to toggle note on/off
                g.on('click',()=>{
		    if(this.selected_note == null){
			if(is_active){
			    this.active_notes.delete(note);
			} else {
			    this.active_notes.set(note,color_notes);
			    // also immediately hide the mouseover tooltip
			    this.tooltip_notes.style('visibility','hidden');
			    // store the selected note
			    this.selected_note = note;
			}
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

        // draw background
        this.drawBackground(xmin, xmax, ymin, ymax);

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
	const enharmonic_name = Tonal.Note.enharmonic(note.name);
	if (enharmonic_name != ''){
	    const enharmonic = Tonal.Note.get(enharmonic_name);
	    this.active_notes.set(enharmonic,color);
	}
    }

    // @param chord: Tonal.Chord
    // @param octave: number
    // @param color: string
    enableChord(chord, color){
        chord.notes.map(d=>this.enableNote(Tonal.Note.get(d),color));
    }

    // @param scale: Tonal.Scale
    // @param color: string
    enableScale(scale, color){
        this.enableChord(scale,color); // same logic, different name
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
