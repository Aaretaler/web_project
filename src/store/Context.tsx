import { createContext, ReactNode, useReducer, useEffect } from 'react'
import { AppState } from '../models/AppState'
import { AppReducer } from './AppReducer'
import { AppAction } from './actions/AppAction'
import { getUserFromLocalStorage } from '../models/User'

interface IAppState extends AppState {
  dispatch: (action: AppAction) => void
}

export const initialState: IAppState = {
  user: null,
  cards: [],
  game: { gameCards: [], cardIndex: 0, answers: [] },
  loginFailed: false,
  isLoading: true,
  dispatch: (action: AppAction) => {},
}

export const AppContext = createContext<IAppState>(initialState)
export let AppStore: IAppState

interface Props {
  children: ReactNode
}

export const AppProvider = ({ children }: Props) => {
  const [state, dispatch] = useReducer(AppReducer, initialState)
  const url = 'api/state'

  useEffect(() => {
    const abortController = new AbortController()
    const accessToken = getUserFromLocalStorage()?.accessToken

    fetch(url, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || null}`
          },
        signal: abortController.signal} )
      .then(response => {
        if (!response.ok) {
          throw Error('failed to fetch data for that resource')
        }
        return response.json()
      })
      .then(data => {
        dispatch({ type: 'set-cards', payload: data.cards })
        dispatch({ type: 'load-game', payload: data.game })
        dispatch({ type: 'load-user' })
        dispatch({ type: 'set-loading', payload: false })
      })
      .catch(err => {
        if (err.name === 'AbortError') {
          console.log('fetch aborted')
        }
      })

    return () => abortController.abort()
  }, [url])

  AppStore = {
    ...state,
    dispatch,
  }

  return <AppContext.Provider value={AppStore}>{children}</AppContext.Provider>
}
