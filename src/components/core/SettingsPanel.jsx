import { AvatarSettings } from '../pngtuber/AvatarSettings'
import { ChatSettings } from '../chat/ChatSettings' 
import './SettingsPanel.css'

export function SettingsPanel({ currentView, ...props }) {
  return (
    <div className="settings-panel-container">
      <div style={{ flex: 1 }}>
        {currentView === 'pngtuber' && (
          <AvatarSettings 
            {...props} 
            presets={props.presets}
            activePresetId={props.activePresetId}
            setActivePresetId={props.setActivePresetId}
            activePreset={props.activePreset}
            addPreset={props.addPreset}
            duplicatePreset={props.duplicatePreset}
            deletePreset={props.deletePreset}
            updatePresetName={props.updatePresetName}
            updatePresetTrigger={props.updatePresetTrigger}
          />
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