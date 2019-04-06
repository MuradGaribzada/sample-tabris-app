
const { Tab, TabFolder, TextView, TextInput, CheckBox, Button, CollectionView, Composite, AlertDialog, NavigationView, Page, ui } = require('tabris');

const { tasks, insertTask, getTaskById, updateTask, deleteTaskById } = require('./TaskService');

let visibleTasks = [];

let filterModel = {  done: null };

let navigationView = new NavigationView({
  left: 0, top: 0, right: 0, bottom: 0
}).appendTo(ui.contentView);

let tasksPage = new Page({
  title: 'ToDo List'
}).appendTo(navigationView);



let todoTabFolder = new TabFolder({
  left: 0, top: 100, right: 0, bottom: 0,
  paging: true
}).appendTo(tasksPage);



let todoTab = new Tab({
  title: 'All Tasks'
}).appendTo(todoTabFolder);


const taskCollectionView = new CollectionView({
  left: 0, right: 0, top: 0, bottom: 0,
  itemCount: visibleTasks.length,
  cellHeight: 64,
  createCell: () => {
    const cell = new Composite({
      background: '#d0d0d0'
    });
    const tasksContainer = new Composite({
      id: 'tasksContainer',
      left: 0, top: 0, bottom: 0, right: 0,
      background: 'white'
    }).on('panHorizontal', event => handlePan(event))
      .on('longpress', event => editTask(event.target.item))
      .appendTo(cell);

    new TextView({
      id: 'taskTitleText',
      top: 8, left: 16,
      font: 'bold 18px'
    }).appendTo(tasksContainer);

    new TextView({
      id: 'taskDescriptionText',
      bottom: 8, left: 16
    }).appendTo(tasksContainer);

    new CheckBox({
      id: "doneCheckbox",
      right: 10,
      enabled: false
    }).appendTo(tasksContainer);

    new Composite({
      left: 0, bottom: 0, right: 0, height: 1,
      background: '#b8b8b8'
    }).appendTo(cell);
    return cell;
  },
  updateCell: (view, index) => {
    const task = visibleTasks[index];
    view.find('#tasksContainer').set({ transform: { translationX: 0 } });
    view.find('#tasksContainer').first().item = task;
    view.find('#taskTitleText').set({ text: task.title });
    view.find('#taskDescriptionText').set({ text: task.description });
    view.find('#doneCheckbox').set({ checked: task.done });
  }
}).appendTo(todoTab);

function handlePan(event) {
  const { target, state, translationX } = event;
  target.transform = { translationX };
  if (state === 'end') {
    handlePanFinished(event);
  }
}

function handlePanFinished(event) {
  const { target, velocityX, translationX } = event;
  const beyondCenter = Math.abs(translationX) > target.bounds.width / 2;
  const fling = Math.abs(velocityX) > 200;
  const sameDirection = sign(velocityX) === sign(translationX);
  const dismiss = beyondCenter ? sameDirection || !fling : sameDirection && fling;
  if (dismiss) {
    animateDismiss(event);
  } else {
    animateCancel(event);
  }
}

function animateDismiss({ target, translationX }) {
  const bounds = target.bounds;
  target.animate({
    transform: { translationX: sign(translationX) * bounds.width }
  }, {
      duration: 200,
      easing: 'ease-out'
    }).then(() => {
      deleteTask(target.item);
    });
}

function animateCancel({ target }) {
  target.animate({ transform: { translationX: 0 } }, { duration: 200, easing: 'ease-out' });
}

function sign(number) {
  return number ? number < 0 ? -1 : 1 : 0;
}


const taskModal = new Composite({
  id: 'taskModal',
  top: 30,
  centerX: 0,
  width: 300,
  height: 250,
  background: 'white',
  elevation: 20,
  visible: false
}).appendTo(ui.contentView);

let idText = new TextView({
  visible: false
}).appendTo(taskModal);

new TextView({
  id: 'titleLabel',
  text: 'Title',
  alignment: 'left',
  left: 10, top: 10, width: 120
}).appendTo(taskModal);

let titleInput = new TextInput({
  message: 'Title',
  top: 10, left: '#titleLabel',
  right: 10,
  baseline: '#titleLabel',
  font: 'bold 18px'
}).appendTo(taskModal);

new TextView({
  id: 'descriptionLabel',
  text: 'Description',
  left: 10, top: '#titleLabel 20', width: 120
}).appendTo(taskModal);

let descriptionInput = new TextInput({
  message: 'Description',
  type: 'multiline',
  left: '#descriptionLabel',
  right: 10, baseline: '#descriptionLabel',
  font: 'bold 18px'
}).appendTo(taskModal);

new TextView({
  id: 'doneLabel',
  text: 'Done',
  left: 10, top: '#descriptionLabel 60', width: 120
}).appendTo(taskModal);

let doneCheckBox = new CheckBox({
  left: '#doneLabel', right: 10,
  baseline: '#doneLabel'
}).appendTo(taskModal);


new Button({ text: "Save", bottom: 20, left: 10 }).on('select', () => saveTask()).appendTo(taskModal);


new Button({ text: "Cancel", bottom: 20, left: 120 }).on('select', () => taskModal.visible = false).appendTo(taskModal);


new Button({
  text: 'New Task',
}).on('select', () => newTask()).appendTo(tasksPage);


new Button({
  text: 'Show All',
  left: 100
}).on('select', () => showAll()).appendTo(tasksPage);


new Button({
  text: 'Show done',
  top: 60
}).on('select', () => showDone()).appendTo(tasksPage);


new Button({
  text: 'Show not done',
  left: 100,
  top: 60
}).on('select', () => showNotDone()).appendTo(tasksPage);

function newTask() {
  idText.text = 0;
  titleInput.text = '';
  descriptionInput.text = '';
  doneCheckBox.checked = false;
  taskModal.visible = true;
}
function editTask(item) {
  let selectedTask = getTaskById(item.id);

  idText.text = selectedTask.id;
  titleInput.text = selectedTask.title;
  descriptionInput.text = selectedTask.description;
  doneCheckBox.checked = selectedTask.done;
  taskModal.visible = true;
}
function deleteTask(item) {
  deleteTaskById(item.id);
  refreshVisibleTasks();
}

function saveTask() {
  if (titleInput.text.trim() === '') {
    new AlertDialog({
      title: 'Title must not be empty',
      buttons: { ok: 'Ok' }
    }).open();
    return;
  }

  let selectedTaskId = parseInt(idText.text);
  if (selectedTaskId > 0) {
    updateTask({
      id: selectedTaskId,
      title: titleInput.text,
      description: descriptionInput.text,
      done: doneCheckBox.checked
    });
  } else {
    insertTask({
      title: titleInput.text,
      description: descriptionInput.text,
      done: doneCheckBox.checked
    });

  }
  taskModal.visible = false;
  refreshVisibleTasks();
}
function showDone() {
  todoTab.title = 'Done Tasks';
  filterModel.done = true;
  refreshVisibleTasks();
}
function showNotDone() {
  todoTab.title = 'Not Done Tasks';
  filterModel.done = false;
  refreshVisibleTasks();
}
function showAll() {
  todoTab.title = 'All Tasks';
  filterModel.done = null;
  refreshVisibleTasks();
}
function refreshVisibleTasks() {
  visibleTasks = tasks.filter(x => (filterModel.done === null || x.done === filterModel.done));
  taskCollectionView.load(visibleTasks.length);
}
