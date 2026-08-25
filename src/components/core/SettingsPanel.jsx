import { AvatarSettings } from '../pngtuber/AvatarSettings'
import { ChatSettings } from '../chat/ChatSettings' 
import './SettingsPanel.css'

export function SettingsPanel({ currentView, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px', boxSizing: 'border-box' }}>
      <div style={{ flex: 1 }}>
        {currentView === 'pngtuber' && (
          <AvatarSettings {...props} />
        )}
        
        {currentView === 'chat' && (
          <ChatSettings 
            twitchInput={props.twitchInput} 
            setTwitchInput={props.setTwitchInput}
            config={props.chatConfig}
            setConfig={props.setChatConfig}
            defaultConfig={props.defaultChatConfig}
            chatPreview={props.chatPreview}
          />
        )}
      </div>
    </div>
  )
}