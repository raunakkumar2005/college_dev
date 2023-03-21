
const tagHeadings = document.querySelectorAll('.tag_heading');
const tagContentSections = document.querySelectorAll('.tag_content_section');

for (let i = 0; i < tagHeadings.length; i++) {
    let heading = tagHeadings[i];
    heading.addEventListener('click', () => {
        for (let j = 0; j < tagHeadings.length; j++) {
            tagHeadings[j].classList.remove('active-tag');
            tagContentSections[j].classList.remove('active_tag_content_section');
        }
        heading.classList.add('active-tag');
        tagContentSections[i].classList.add('active_tag_content_section');
    });
}
