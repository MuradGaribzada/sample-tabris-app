
let tasks = [];
let lastId = 0;
function insertTask(task) {
    if (task.title && task.title.trim() !== '') {
        tasks.push({
            id: generateAndReturnId(),
            title: task.title,
            description: task.description,
            done: task.done
        });
    } else {
        throw new Error('Title must not be empty');
    }
}


function generateAndReturnId() {
    lastId++;
    return lastId;
}

function getTaskById(taskId) {
    let foundTask = tasks.find(t => t.id === taskId);
    if (foundTask !== 'undefined') {
        return foundTask;
    }
    else {
        throw new Error('Task not found');
    }
}
function updateTask(task) {
    let selectedTaskIndex = tasks.findIndex(t => t.id === task.id);
    if (selectedTaskIndex.id >= 0) {
        tasks[selectedTaskIndex] = {
            id: task.id,
            title: task.title,
            description: task.description,
            done: task.done
        };
    }
    else {
        throw new Error('Task not found');
    }

}


function deleteTaskById(id) {
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex >= 0) {
        tasks.splice(taskIndex, 1);
    } else {
        throw new Error('Task not found');
    }
}


module.exports = { tasks, insertTask, getTaskById, updateTask, deleteTaskById };

