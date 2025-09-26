import SettingsForm from './components/SettingsForm'

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <p>
        In order to be able to use the app, you need to set your Bluesky
        credentials here. These are stored encrypted locally in the app-data folder. 
      </p>
      <p>
        Also, you need to set the path to your backup folder. This is the folder where
        your backups and drafts will be stored. Example: /Users/username/Documents/BskyBackup
      </p>
      <SettingsForm />
    </div>
  )
}