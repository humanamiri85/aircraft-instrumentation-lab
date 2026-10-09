// The root Explore Lab never imports this entry point or any journey module.
import('./view.js').then(module=>module.startJourney()).catch(error=>{
  console.error('Guided Journey unavailable:',error);
  document.querySelector('#journey-root').innerHTML='<h1>Guided Journey unavailable</h1><p role="status">The guided experience could not load. The existing Explore Lab remains available.</p><a href="./">Explore Full Lab</a>';
});
