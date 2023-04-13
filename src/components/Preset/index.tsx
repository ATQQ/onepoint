import { Avatar, List, Skeleton, Divider } from 'antd'
import PubSub from 'pubsub-js'
import { useAppSelector, useAppDispatch } from '../../app/hooks'
import { PresetType } from '../../@types'

interface Props {
  onPresetChange: (preset: PresetType) => void
}

const padding = 15
export function Preset(props: Props) {
  const { onPresetChange } = props
  const presetState = useAppSelector(state => state.preset)
  const dispatch = useAppDispatch()

  return presetState.listVisible ? (
    <>
      <Divider style={{ margin: 0 }} />
      {/* @ts-ignore */}
      <div style={styles.searchRegion}>
        <List
          className="demo-loadmore-list"
          // loading={initLoading}
          itemLayout="horizontal"
          // loadMore={loadMore}
          dataSource={presetState.builtInPlugins}
          renderItem={item => (
            <List.Item
              className="ant-list-item"
              actions={
                [
                  // <a
                  //   key="list-loadmore-edit"
                  //   style={{ marginRight: padding, color: '#a6a6a6' }}
                  // >
                  //   Edit
                  // </a>,
                ]
              }
              onClick={() => {
                onPresetChange(item.title)
                PubSub.publish('showPanel', {})
              }}
            >
              <Skeleton avatar title={false} loading={item.loading} active>
                <List.Item.Meta
                  style={{ paddingLeft: padding }}
                  avatar={<Avatar src={item.logo} />}
                  title={item.title}
                  description={item.desc}
                />
              </Skeleton>
            </List.Item>
          )}
        />
      </div>
    </>
  ) : null
}

const styles = {
  searchRegion: {
    // display: 'flex',
    // flexDirection: 'row',
  },
}
