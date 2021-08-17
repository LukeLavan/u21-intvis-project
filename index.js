// driver

let svg = d3.select('#fretboard');
if(svg.empty()){
    console.log('couldn\'t find svg!');
}
let bass = new fretboard(svg);
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
    bass = new fretboard(svg);
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
