// Global app controller
import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likeView from './views/likeView';
import { elements, renderLoader, clearLoader } from './views/base';


/** Global state of the app
 * - Search object;
 * - Current recipe object;
 * - Shopping list object;
 * - Liked recipes;  
 */
const state = {};
window.state = state;

/**
 * SEARCH CONTROLLER
 */
const controlSearch = async () => {
    // 1) Get query from view
    const query = searchView.getInput();

    if (query) {
        // 2) New search object and add to state
        state.search = new Search(query);

        // 3) Prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchResult);

        try {
            // 4) Search for recipes
            await state.search.getResults();

            // 5) Render results on UI
            clearLoader();
            searchView.renderResults(state.search.result);
        } catch (err) {
            alert('Error processing search!');
        }
    }
};

//Create event listener for every time search button is pressed
elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();  //not refresh
    controlSearch();
});

elements.searchResultPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    }
});

/**
 * RECIPE CONTROLLER
 */

const controlRecipe = async () => {
    // Get id from URL
    const id = window.location.hash.replace('#', '');

    if (id) {
        // Prepare UI for changes
        renderLoader(elements.recipe);
        recipeView.clearRecipe();

        // HightLight selected search item´
        if (state.search) searchView.highlightSelected(id);

        // Create new recipe object
        state.recipe = new Recipe(id);

        try {
            // Get recipe data
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();

            // Calculate servings and time
            state.recipe.calcTime();
            state.recipe.calcServings();

            // Render recipe
            // console.log(state.recipe);
            clearLoader();
            recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));

        } catch (err) {
            alert('Error processing recipe!');
        }
    }
}

// window.addEventListener('hashchange', controlRecipe);
// window.addEventListener('load', controlRecipe);
['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));


/**
 * LIST CONTROLLER
 */
const controlList = () => {
    // Create a new list if there is none yet
    if (!state.list) state.list = new List();

    // Add each ingredients to the list
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
}

/**
 * LIKES CONTROLLER
 */

state.likes = new Likes();
const controlLike = () => {
    // Create a new Likes if there is none yet
    if (!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;

    // User has not yet liked current recipe
    if (!state.likes.isLiked(currentID)) {
        // Add like to the state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );

        // Toggle the like button
        likeView.toggleLikeBtn(true);

        // Add like to the UI
        likeView.renderLike(newLike);

    } // User has not liked current recipe
    else {
        // Remove like from the state
        state.likes.deleteLike(currentID);

        // Toggle the like button
        likeView.toggleLikeBtn(false);

        // Remove like from UI list 
        likeView.deleteLike(currentID);
    }
    likeView.toggleLikeMenu(state.likes.getNumLikes());
};


// Handle deelte and update list item events
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    //Handle the delete button
    if (e.target.matches('.shopping__delete, .shopping__delete *')) {
        // Delete from state 
        state.list.deleteItem(id);

        // Delete from UI
        listView.deleteItem(id);

        // Handling update buttons  
    } else if (e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
});


// Handling recipe button clicks (event delegation)
elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')) {
        // Descrease button is clicked
        if (state.recipe.servings > 1) state.recipe.updateServings('dec');
        recipeView.updateServingIngredients(state.recipe);
    } else if (e.target.matches('.btn-increase, .btn-increase *')) {
        // increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingIngredients(state.recipe);
    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        //Add ingredients to shopping list
        controlList();
    }
    else if (e.target.matches('.recipe__love, .recipe__love *')) {
        // Like controller
        controlLike();
    }
});
