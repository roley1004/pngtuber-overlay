export function Avatar({ isTalking, currentImage }) {
  return (
    <div className={`avatar-container ${isTalking ? 'talking-bounce' : ''}`}>
      <img className="avatar-state" src={currentImage} alt="Avatar" />
    </div>
  )
}