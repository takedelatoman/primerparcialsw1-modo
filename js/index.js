
window.addEventListener('load', () => {
  const io = require('socket.io-client');
  const socket = io.connect('http://localhost:9090');
  const EditorUi = require('./src/EditorUi.js');
  const path = require('path');

// Extends EditorUi to update I/O action states based on availability of backend

var editorUiInit = EditorUi.prototype.init;

EditorUi.prototype.init = function () {
  //console.log('init Editor UI prototype...');
  editorUiInit.apply(this, arguments);
  this.actions.get('export').setEnabled(true);

  // Updates action states which require a backend
  Editor.useLocalStorage = true;
  Editor.useFileSystemSave = true;
  if (!Editor.useLocalStorage) {
    mxUtils.post(OPEN_URL, '', mxUtils.bind(this, function (req) {
      var enabled = req.getStatus() != 404;
       this.actions.get('open').setEnabled(enabled || Graph.fileSupport);
       this.actions.get('import').setEnabled(enabled || Graph.fileSupport);
       this.actions.get('save').setEnabled(enabled);
       this.actions.get('saveAs').setEnabled(enabled);
       this.actions.get('export').setEnabled(enabled);
    }));
  }

  // Extends graphChangeListener to emit socket server
  
  var graphChangeListener = EditorUi.prototype.editor.graphChangeListener;
  EditorUi.prototype.editor.graphChangeListener = function(sender, eventObject) {
    graphChangeListener.apply(this, arguments);
    console.log('graphChangeListener extened event captured!!!!....')
     console.log(event);
    if((event && event.pointerType) || (event && event.key == 'Delete')){
      //console.log('is a pointer type...');
      const snapshotDiagramXml = EditorUi.prototype.editor.getGraphXml();
      const xmlString = (new XMLSerializer()).serializeToString(snapshotDiagramXml);
      socket.emit('draw_component', { xml: xmlString  });
    }

  }
  
};


// Extends itemClicked to emit socket server

var itemClicked = EditorUi.prototype.sidebar.prototype.itemClicked;
EditorUi.prototype.sidebar.prototype.itemClicked = function(cells, ds, evt, elt){
  itemClicked.apply(this, arguments);
  //console.log('extends from itemClicked...');
  const snapshotDiagramXml = this.editorUi.editor.getGraphXml();
  const xmlString = (new XMLSerializer()).serializeToString(snapshotDiagramXml);
  socket.emit('draw_component', { xml: xmlString  });
  
}



// Adds required resources (disables loading of fallback properties, this can only
// be used if we know that all keys are defined in the language specific file)
mxResources.loadDefaultBundle = false;
var bundle = mxResources.getDefaultBundle(RESOURCE_BASE, mxLanguage) ||
  mxResources.getSpecialBundle(RESOURCE_BASE, mxLanguage);

// Fixes possible asynchronous requests
mxUtils.getAll([bundle, STYLE_PATH + '/default.xml'], function (xhr) {
  // Adds bundle text to resources
  mxResources.parse(xhr[0].getText());

  // Configures the default graph theme
  var themes = new Object();
  themes[Graph.prototype.defaultThemeName] = xhr[1].getDocumentElement();

  // Main
  new EditorUi(new Editor(urlParams.chrome == '0', themes));
}, function () {
  document.body.innerHTML = '<center style="margin-top:10%;">Error loading resource files. Please check browser console.</center>';
});



// socket configure
socket.on('connect', () => {
  // Events for welcome
  //socket.emit('welcome',{message:'bienvenido usuario'});
  socket.on('welcome',(data)=>{
    console.log('data.message...',data.message);
  });

   socket.on('draw_component', (data) => {
    console.log('Listen to socketClient.drawComponent');
     const { xml: xmlString } = data;
     //console.log('xmlstring es ',xmlString);
     if(xmlString !== ''){    
         EditorUi.prototype.editor.setGraphXml(window.parent.mxUtils.parseXml(xmlString).documentElement);
        
     }
  })
  
  // // Get a list of all files, previously delete existing
  // // elements to avoid duplicates
  // socket.on('files', (files) => {
  //   console.log('socket.files', files)
  //   clearAllElements()
  //   files.forEach(filePath => action('add', filePath))
  // })

  // // Updating statistics
  // socket.on('statistics', (payload) => {
  //   statisticsElement.innerHTML = `
  //     <div>Statistics</div>
  //     <span>${formatBytes(payload.freemem)}</span> / <span>${formatBytes(payload.totalmem)}</span>
  //   `
  // })

   

})

});

