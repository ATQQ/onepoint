import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { PresetType } from '../../@types'
import { baseApiHost } from '../../app/api'
import { timeoutPromise } from '../../utils/fetch'
import { ERR_CODES } from '../../electron/types'

interface ChatModule {
  resp: Record<string, string>
  visible: boolean
  inputDiabled: boolean
  respErr: boolean
  respErrMsg: string
  curPrompt: Record<string, string>
  isGenerating: boolean
  webCrawlResp: string
}

export const initialState: ChatModule = {
  resp: {},
  visible: false,
  inputDiabled: false,
  respErr: false,
  respErrMsg: '',
  curPrompt: {},
  isGenerating: false,
  webCrawlResp: '', // Distinguishing proprietary err & errmsg
}

interface PresetContent {
  preset: PresetType
  content: string
}

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    saveResp: (state, action: PayloadAction<PresetContent>) => {
      const {
        payload: { preset, content },
      } = action
      const resp = state.resp
      resp[preset] = content
      state.resp = resp
    },
    setVisible: (state, action: PayloadAction<boolean>) => {
      const { payload } = action
      state.visible = payload
    },
    setInputDisabled: (state, action: PayloadAction<boolean>) => {
      const { payload } = action
      state.inputDiabled = payload
    },
    setRespErr: (state, action: PayloadAction<boolean>) => {
      const { payload } = action
      state.respErr = payload
    },
    setRespErrMsg: (state, action: PayloadAction<string>) => {
      const { payload } = action
      state.respErrMsg = payload
    },
    setCurPrompt: (state, action: PayloadAction<PresetContent>) => {
      const {
        payload: { preset, content },
      } = action
      const curPrompt = state.curPrompt
      curPrompt[preset] = content
      state.curPrompt = curPrompt
    },
    setGenerating: (state, action: PayloadAction<boolean>) => {
      const { payload } = action
      state.isGenerating = payload
    },
    saveWebCrawlResp: (state, action: PayloadAction<string>) => {
      const { payload } = action
      state.webCrawlResp = payload
    },
  },
})

export const {
  saveResp,
  setVisible,
  setInputDisabled,
  setRespErr,
  setRespErrMsg,
  setCurPrompt,
  setGenerating,
  saveWebCrawlResp,
} = chatSlice.actions

export const fetchChatResp = createAsyncThunk(
  'chat/fetchChatResp',
  async (
    args: {
      prompt: string
      preset: PresetType
    },
    { dispatch }
  ) => {
    const { prompt, preset } = args
    dispatch(setInputDisabled(true))
    dispatch(setRespErr(false))
    dispatch(setGenerating(true))

    const request = () => {
      /* eslint-disable no-async-promise-executor */
      return new Promise(async (resolve, reject) => {
        const response = await fetch(`${baseApiHost}/prompt`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            preset,
          }),
        })

        const reader = response.body
          ?.pipeThrough(new TextDecoderStream())
          .getReader()

        let str = ''
        let shown = false
        while (true) {
          if (!reader) break
          const { value, done } = await reader.read()
          if (done) break
          if (!shown) {
            dispatch(setVisible(true))
            shown = true
          }
          if (Number(value) === ERR_CODES.NOT_SET_APIKEY) {
            reject(new Error('please set your apikey first.'))
            break
          }

          if (Number(value) === ERR_CODES.NETWORK_CONGESTION) {
            reject(
              new Error('Network error. Check whether you have set up a proxy')
            )
            break
          }
          str += value
          dispatch(
            saveResp({
              preset,
              content: str,
            })
          )
        }
        resolve(true)
      })
    }

    Promise.race([
      timeoutPromise(
        20000,
        'High network latency. Check whether you have set up a proxy'
      ),
      request(),
    ])
      .then()
      .catch(e => {
        dispatch(setVisible(true))
        dispatch(setRespErr(true))
        dispatch(setRespErrMsg(e.message))
      })
      .finally(() => {
        dispatch(setGenerating(false))
        dispatch(setInputDisabled(false))
      })
  }
)

export const fetchWebCrawlResp = createAsyncThunk(
  'chat/fetchWebCrawlResp',
  async (
    args: {
      url: string
      preset: PresetType
    },
    { dispatch }
  ) => {
    const { url, preset } = args
    dispatch(setInputDisabled(true))
    dispatch(setRespErr(false))
    dispatch(setGenerating(true))

    const request = async () => {
      const response = await fetch(`${baseApiHost}/crawl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          preset,
        }),
      })
      return response.json()
    }

    Promise.race([
      timeoutPromise(
        20000,
        'High network latency. Check whether you have set up a proxy'
      ),
      request(),
    ])
      .then(resp => {
        const { result, code, message } = resp
        if (code === 0) {
          dispatch(setVisible(true))
          dispatch(saveWebCrawlResp(result))
        } else {
          dispatch(setRespErr(true))
          dispatch(setRespErrMsg(message))
        }
      })
      .catch(e => {
        dispatch(setVisible(true))
        dispatch(setRespErr(true))
        dispatch(setRespErrMsg(e.message))
      })
      .finally(() => {
        dispatch(setGenerating(false))
        dispatch(setInputDisabled(false))
      })
  }
)

export default chatSlice.reducer
