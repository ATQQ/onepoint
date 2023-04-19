import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { timeoutPromise } from '../../utils/fetch'
import { baseApiHost } from '../../app/api'
interface SettingModule {
  visible: boolean
  billUsage: number
  basePath: string
  apikey: string
  loadAccount: boolean
  usemodel: string
  minimal: boolean
  contextual: number
  store: number
  lng: string
}

export const defaultVals = {
  lng: 'English',
  store: 0,
  contexual: 0,
  minimal: false,
}

export const initialState: SettingModule = {
  visible: false,
  loadAccount: true,
  billUsage: 0,
  basePath: '',
  apikey: '',
  usemodel: '',
  minimal: defaultVals.minimal,
  contextual: defaultVals.contexual,
  store: defaultVals.store,
  lng: defaultVals.lng,
}

export const settingSlice = createSlice({
  name: 'setting',
  initialState,
  reducers: {
    setVisible: (state, action: PayloadAction<boolean>) => {
      const { payload } = action
      state.visible = payload
    },
    setUsage: (state, action: PayloadAction<number>) => {
      const { payload } = action
      state.billUsage = payload
    },
    setBasePath: (state, action: PayloadAction<string>) => {
      const { payload } = action
      state.basePath = payload
    },
    setApikey: (state, action: PayloadAction<string>) => {
      const { payload } = action
      state.apikey = payload
    },
    setUsemodel: (state, action: PayloadAction<string>) => {
      const { payload } = action
      state.usemodel = payload
    },
    setLoadAccount: (state, action: PayloadAction<boolean>) => {
      const { payload } = action
      state.loadAccount = payload
    },
    setMinimal: (state, action: PayloadAction<boolean>) => {
      const { payload } = action
      state.minimal = payload
    },
    setContexual: (state, action: PayloadAction<number>) => {
      const { payload } = action
      state.contextual = payload
    },
    setStore: (state, action: PayloadAction<number>) => {
      const { payload } = action
      state.store = payload
    },
    setLng: (state, action: PayloadAction<string>) => {
      const { payload } = action
      state.lng = payload
    },
  },
})

export const {
  setVisible,
  setUsage,
  setBasePath,
  setApikey,
  setUsemodel,
  setLoadAccount,
  setMinimal,
  setContexual,
  setStore,
  setLng,
} = settingSlice.actions

export const fetchAccountDetail = createAsyncThunk(
  'setting/fetchAccountDetail',
  async (
    args: {
      startDate: string
      endDate: string
    },
    { dispatch }
  ) => {
    const { startDate, endDate } = args
    dispatch(setLoadAccount(true))
    const request = async () => {
      const response = await fetch(`${baseApiHost}/account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_date: startDate,
          end_date: endDate,
        }),
      })
      return response.json()
    }

    Promise.race([
      timeoutPromise(
        5000,
        'Network congestion, check whether you have set up a proxy'
      ),
      request(),
    ])
      .then(resp => {
        console.log(resp)
        const {
          basic: { apiHost, apiKey, usemodel },
          usageData,
        } = resp.result
        dispatch(setBasePath(apiHost))
        dispatch(setApikey(apiKey))
        dispatch(setUsemodel(usemodel))
        if (resp.code === 0) {
          dispatch(setUsage(Math.round(usageData.total_usage)))
        }
      })
      .catch(e => {
        console.log(e)
      })
      .finally(() => {
        dispatch(setLoadAccount(false))
      })
  }
)

export default settingSlice.reducer
