// driver

let svg = d3.select('#fretboard');
if(svg.empty()){
    console.log('couldn\'t find svg!');
}
let bass = new fretboard(svg);
// initial draw of empty fretboard
bass.draw();

const scaleTypes = ['Select scale type', 'Major', 'Minor', 'Major Pentatonic', 'Minor Pentatonic', 'Minor Blues', 'Major Blues']
const arpeggioTypes = ['Select arpeggio type', 'Major', 'Minor', 'Major Seventh', 'Minor Seventh', 'Dominant Seventh', 'Augmented', 'Diminished']
// functions for testing
function showScale() {
    if (bass.selected_note == null){
	alert('Please select a note on the fretboard');
	return;
    }
    bass.clear();
    scale_type = d3.select('#select_scale_type').property('value');
    if (scale_type == 'Select scale type') return;
    scale_name = bass.selected_note.name + ' ' + scale_type; 
    scale_name = scale_name.toLowerCase();
    const scale = Tonal.Scale.get(scale_name);
    const range = Tonal.Scale.rangeOf(scale_name);
    // modified note list to include the octave
    start_note = bass.selected_note.letter + 0;
    end_note = bass.selected_note.letter + 8; // (bass.selected_note.oct + 1);
    scale.notes = range(start_note, end_note);
    console.log('Enabling all notes in a '+scale.name+' scale');
    console.log(scale);
    if (scale_type.includes('Major')) bass.enableScale(scale,'orange');
    else if (scale_type.includes('Minor')) bass.enableScale(scale, 'lightblue');
    else bass.enableScale(scale, 'green');
    bass.draw();
}

function showArpeggio() {
    if (bass.selected_note == null){
	alert('Please select a note on the fretboard');
	return;
    }
    bass.clear();
    arpeggio_type = d3.select('#select_arpeggio_type').property('value');
    if (arpeggio_type == 'Select arpeggio type') return;
    arpeggio_name = bass.selected_note.name + ' ' + arpeggio_type;
    arpeggio_name = arpeggio_name.toLowerCase();
    const chord = Tonal.Chord.get(arpeggio_name);
    console.log('Enabling all notes in a '+chord.symbol+' chord at octave 2');
    console.log(chord);
    if (arpeggio_type.includes('Major')) bass.enableChord(chord, 'orange');
    else if (arpeggio_type.includes('Minor')) bass.enableChord(chord, 'lightblue');
    else bass.enableChord(chord, 'green');
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

function clear(){
    console.log('Clearing all active notes');
    bass.clear();
    bass.selected_note = null;
    bass.draw();
}

const testFretNumOptions = [12,6];
function testFretNum(){
    const n = d3.select('#select_fretnum').property('value');
    d3.selectAll('#fretboard > *').remove();
    num_frets = n;
    bass = new fretboard(svg);
    bass.draw();
}

// buttons that call above testing functions
buttons = d3.select('#scale_buttons');

const scaleTypeList = buttons.append('select')
    .attr('id','select_scale_type')

scaleTypeList.selectAll('option')
    .data(scaleTypes).enter()
//    .data(Tonal.Scale.names()).enter()
    .append('option')
	.text(d=>d);

const scaleButton = buttons.append('button')
    .text('Show Scale')
    .on('click',showScale);

buttons = d3.select('#arpeggio_buttons');

const arpeggioTypeList = buttons.append('select')
    .attr('id','select_arpeggio_type')

arpeggioTypeList.selectAll('option')
    .data(arpeggioTypes).enter()
    .append('option')
	.text(d=>d);

const arpeggioButton = buttons.append('button')
    .text('Show Arpeggio')
    .on('click',showArpeggio);

buttons = d3.select('#misc_buttons');

const testTuningButton = buttons.append('select')
    .attr('id','select_tuning')
    .on('change',testTuning);

const testFretNumButton = buttons.append('select')
    .attr('id','select_fretnum')
    .on('change',testFretNum);
testFretNumButton.selectAll('option')
    .data(testFretNumOptions).enter()
    .append('option').text(d=>d);

testTuningButton.selectAll('option')
    .data(testTuningsNames).enter()
    .append('option')
        .text(d=>d);

buttons = d3.select('#clear_button');

const clearButton = buttons.append('button')
    .text('Clear')
    .on('click',clear);


