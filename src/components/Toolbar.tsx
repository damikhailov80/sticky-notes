import './Toolbar.css';

interface ToolbarProps {
  onAddNote: (color: string) => void;
  availableColors: string[];
}

const Toolbar = ({ onAddNote, availableColors }: ToolbarProps) => {
  return (
    <div className="toolbar">
      <h2 className="toolbar-title">Sticky Notes</h2>
      <div className="toolbar-section">
        <span className="toolbar-label">Add Note:</span>
        <div className="color-buttons">
          {availableColors.map(color => (
            <button
              key={color}
              className="color-button"
              style={{ backgroundColor: color }}
              onClick={() => onAddNote(color)}
              title={`Add ${color} note`}
            />
          ))}
        </div>
      </div>
      <div className="toolbar-instructions">
        <p>
          <strong>Instructions:</strong>
        </p>
        <ul>
          <li>Click a color button to create a new note</li>
          <li>Drag the header to move notes</li>
          <li>Drag the bottom-right corner to resize</li>
          <li>Drag notes to the trash zone to delete</li>
          <li>Click on a note to bring it to front</li>
        </ul>
      </div>
    </div>
  );
};

export default Toolbar;
