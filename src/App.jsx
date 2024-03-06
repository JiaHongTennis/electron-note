import { memo } from 'react'
import { useRoutes } from 'react-router-dom'
import routes from './router'

const App = memo(() => {
  return (
    <div style={{ width: '100%', height: '100%' }} className="App">
      {
        useRoutes(routes)
      }
    </div>
  );
})

export default App;
