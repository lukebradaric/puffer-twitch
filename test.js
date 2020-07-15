let j = 5;


async function gays()
{
  console.log("hi");
  for (let i = 0; i < j; i++)
  {
    await (
      console.log(i)
    );
  }
}

gays()